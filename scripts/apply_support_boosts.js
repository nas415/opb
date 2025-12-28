import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'cards.js');
let src = fs.readFileSync(filePath, 'utf8');

// collect all ids and determine max stage per base
const idRegex = /id:\s*"([A-Za-z0-9_]+)"/g;
const groups = new Map();
let m;
while ((m = idRegex.exec(src)) !== null) {
  const id = m[1];
  const stageMatch = id.match(/_(\d{2})$/) || id.match(/_(\d+)$/);
  const stage = stageMatch ? parseInt(stageMatch[1], 10) : 1;
  const base = id.replace(/_(?:\d{2}|\d+)$/, '');
  const arr = groups.get(base) || [];
  arr.push({ id, stage });
  groups.set(base, arr);
}

const maxStageMap = new Map();
for (const [base, arr] of groups) {
  const max = Math.max(...arr.map(x=>x.stage));
  maxStageMap.set(base, max);
}

function getRangeForRank(rank) {
  switch ((rank||'').toUpperCase()) {
    case 'C': return [1,10];
    case 'B': return [1,15];
    case 'A': return [1,20];
    case 'S': return [1,30];
    case 'SS': return [1,40];
    case 'UR': return [1,50];
    default: return [1,10];
  }
}

// For each Support card object, find and patch
let idx = 0;
while (true) {
  const found = src.indexOf('\n  { id:', idx);
  if (found === -1) break;
  const start = src.indexOf('{', found);
  // find matching closing brace for this object
  let pos = start;
  let depth = 0;
  let end = -1;
  while (pos < src.length) {
    const ch = src[pos];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { end = pos; break; }
    }
    pos++;
  }
  if (end === -1) break;

  const objText = src.slice(start, end+1);
  if (!/type:\s*"Support"/.test(objText)) { idx = end + 1; continue; }

  // compute stage-based boost value even if a boost already exists (overwrite to keep consistent)

  // extract id and rank
  const idMatch = objText.match(/id:\s*"([A-Za-z0-9_]+)"/);
  const rankMatch = objText.match(/rank:\s*"([A-Za-z0-9]+)"/);
  if (!idMatch || !rankMatch) { idx = end + 1; continue; }
  const id = idMatch[1];
  const rank = rankMatch[1];

  // determine stage and maxStage
  const stageMatch = id.match(/_(\d{2})$/) || id.match(/_(\d+)$/);
  const stage = stageMatch ? parseInt(stageMatch[1], 10) : 1;
  const base = id.replace(/_(?:\d{2}|\d+)$/, '');
  const maxStage = maxStageMap.get(base) || 1;

  // determine ability
  const abilityMatch = objText.match(/ability:\s*("([^"]*)"|null)/);
  const abilityRaw = abilityMatch ? (abilityMatch[2] || '') : '';

  // choose mode: prefer explicit in ability, else default support->hp
  let mode = 'hp';
  if (abilityRaw) {
    const a = abilityRaw.toLowerCase();
    if (a.includes('attack')) mode = 'attack';
    else if (a.includes('special')) mode = 'special';
    else if (a.includes('both')) mode = 'both';
    else if (a.includes('hp')||a.includes('health')) mode = 'hp';
  }

  // compute boost value: use rank ranges and stage scaling
  const range = getRangeForRank(rank);
  const [min, max] = range;
  let val;
  if (maxStage <= 1) {
    val = Math.round((min + max) / 2); // midpoint when single-stage
  } else {
    val = Math.round(min + (max - min) * (stage / maxStage));
  }

  // build replacement snippet
  let replacementFields = '';
  if (mode === 'both') {
    replacementFields = `ability: "Boosts team ATK and HP by ${val}%",
    boost: { atk: ${val}, hp: ${val} },`;
  } else if (mode === 'attack') {
    replacementFields = `ability: "Boosts team ATK by ${val}%",
    boost: { atk: ${val} },`;
  } else if (mode === 'special') {
    replacementFields = `ability: "Boosts team SPECIAL by ${val}%",
    boost: { special: ${val} },`;
  } else {
    replacementFields = `ability: "Boosts team HP by ${val}%",
    boost: { hp: ${val} },`;
  }

  // replace ability: null or ability: "..." with our fields
  let newObjText;
  if (/ability:\s*null/.test(objText)) {
    newObjText = objText.replace(/ability:\s*null/, replacementFields);
  } else if (/ability:\s*"[^"]*"/.test(objText)) {
    // if ability contains percent already, prefer it and also add boost object accordingly
    const aMatch = objText.match(/ability:\s*"([^"]*)"/);
    const aText = aMatch ? aMatch[1] : '';
    const pctMatch = aText.match(/(\d{1,3})\s*%/);
    if (pctMatch) {
      const num = parseInt(pctMatch[1],10);
      let b;
      if (aText.toLowerCase().includes('attack')) b = `boost: { atk: ${num} },`;
      else if (aText.toLowerCase().includes('both')) b = `boost: { atk: ${num}, hp: ${num} },`;
      else if (aText.toLowerCase().includes('special')) b = `boost: { special: ${num} },`;
      else b = `boost: { hp: ${num} },`;
      newObjText = objText.replace(/ability:\s*"([^"]*)"/, `ability: "${aText}",\n    ${b}`);
    } else {
      // replace ability string with our combined ability and boost
      newObjText = objText.replace(/ability:\s*"([^"]*)"/, replacementFields);
    }
  } else {
    // add fields near image or before evolutions
    newObjText = objText.replace(/(image:\s*"[^"]*",)/, `$1\n    ${replacementFields}`);
  }

  // apply change
  src = src.slice(0, start) + newObjText + src.slice(end+1);
  idx = start + newObjText.length;
}

fs.writeFileSync(filePath, src, 'utf8');
console.log('Applied support boosts to cards.js');
