import { getCardById, cards } from "../cards.js";

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getRangeForRank(rank, mode) {
  // return [min,max] inclusive for given rank and mode. mode: 'single'|'both'|'special'
  switch ((rank || '').toUpperCase()) {
    case 'C':
      if (mode === 'single') return [1,10];
      if (mode === 'both') return [1,8];
      return null; // C doesn't grant special
    case 'B':
      if (mode === 'single') return [1,15];
      if (mode === 'both') return [1,12];
      return null;
    case 'A':
      if (mode === 'single') return [1,20];
      if (mode === 'both') return [1,15];
      if (mode === 'special') return [1,5];
      return null;
    case 'S':
      if (mode === 'single') return [1,30];
      if (mode === 'both') return [1,20];
      if (mode === 'special') return [1,8];
      return null;
    case 'SS':
      if (mode === 'single') return [1,40];
      if (mode === 'both') return [1,25];
      if (mode === 'special') return [1,10];
      return null;
    case 'UR':
      if (mode === 'single') return [1,50];
      if (mode === 'both') return [1,25];
      if (mode === 'special') return [1,15];
      return null;
    default:
      return null;
  }
}

// build a map from base id -> max stage number (e.g., nojiko -> 3)
const maxStageMap = (() => {
  const map = new Map();
  for (const c of (cards || [])) {
    if (!c.id) continue;
    const m = c.id.match(/_(\d{2})$/) || c.id.match(/_(\d+)$/);
    const stage = m ? parseInt(m[1], 10) : 1;
    const base = c.id.replace(/_(?:\d{2}|\d+)$/, '');
    const cur = map.get(base) || 0;
    if (stage > cur) map.set(base, stage);
  }
  return map;
})();

export function computeTeamBoosts(teamIds) {
  const out = { atk: 0, hp: 0, special: 0 };
  if (!teamIds || !Array.isArray(teamIds)) return out;
  for (const id of teamIds) {
    const c = getCardById(id);
    if (!c) continue;

    // explicit boost object on card takes precedence
    if (c.boost && (c.boost.atk || c.boost.hp || c.boost.special)) {
      if (c.boost.atk) out.atk += c.boost.atk;
      if (c.boost.hp) out.hp += c.boost.hp;
      if (c.boost.special) out.special += c.boost.special;
      continue;
    }

    // allow Support-type cards to act as boost cards (default to HP)
    const abilityRaw = (c.ability || "").trim();
    const isSupport = (c.type && String(c.type).toLowerCase() === 'support');

    // if ability contains explicit percent, honor it for non-support cards
    if (abilityRaw) {
      const pctMatch = abilityRaw.match(/(\d{1,3})\s*%/);
      const ability = abilityRaw.toLowerCase();
      if (pctMatch && !isSupport) {
        const num = parseInt(pctMatch[1], 10);
        if (ability.includes('attack') || ability.includes('atk')) out.atk += num;
        else if (ability.includes('both')) { out.atk += num; out.hp += num; }
        else if (ability.includes('special')) out.special += num;
        else out.hp += num;
        continue;
      }
    }

    // Determine if this card should be treated as a boost card:
    // - explicit ability text -> inferred
    // - OR support-type cards (default to HP)
    const isSupport = (c.type && String(c.type).toLowerCase() === 'support');
    if (!abilityRaw && !isSupport) continue; // not a boost card

    const ability = (abilityRaw || '').toLowerCase();

    // infer mode
    let mode = null;
    if (ability.includes('both')) mode = 'both';
    else if (ability.includes('attack') || ability.includes('atk')) mode = 'single';
    else if (ability.includes('special')) mode = 'special';
    else if (ability.includes('hp') || ability.includes('health')) mode = 'single';
    else if (isSupport) mode = 'single'; // default support -> hp

    if (!mode) continue;

    const range = getRangeForRank(c.rank, mode);
    if (!range) continue;
    const [min, max] = range;
    // compute stage-aware value
    const idStr = c.id || '';
    const m = idStr.match(/_(\d{2})$/) || idStr.match(/_(\d+)$/);
    const stage = m ? parseInt(m[1], 10) : 1;
    const base = idStr.replace(/_(?:\d{2}|\d+)$/, '');
    const maxStage = maxStageMap.get(base) || 1;
    let val;
    if (maxStage <= 1) val = Math.round((min + max) / 2);
    else {
      const computed = Math.round(min + (max - min) * (stage / maxStage));
      val = Math.min(max, computed + 1);
    }

    if (mode === 'both') { out.atk += val; out.hp += val; }
    else if (mode === 'single') {
      if (ability.includes('hp') || ability.includes('health') || isSupport) out.hp += val; else out.atk += val;
    } else if (mode === 'special') { out.special += val; }
  }
  return out;
}

export function computeTeamBoostsDetailed(teamIds) {
  const totals = { atk: 0, hp: 0, special: 0 };
  const details = [];
  if (!teamIds || !Array.isArray(teamIds)) return { totals, details };
  for (const id of teamIds) {
    const c = getCardById(id);
    if (!c) continue;
    let entry = { id: c.id, name: c.name, atk: 0, hp: 0, special: 0, reason: null };

    if (c.boost && (c.boost.atk || c.boost.hp || c.boost.special)) {
      entry.atk = c.boost.atk || 0;
      entry.hp = c.boost.hp || 0;
      entry.special = c.boost.special || 0;
      entry.reason = 'explicit boost';
    } else {
      const abilityRaw = (c.ability || "").trim();
      if (abilityRaw) {
        const pctMatch = abilityRaw.match(/(\d{1,3})\s*%/);
        const ability = abilityRaw.toLowerCase();
        const isSupport = (c.type && String(c.type).toLowerCase() === 'support');
        if (pctMatch && !isSupport) {
          const num = parseInt(pctMatch[1], 10);
          if (ability.includes('attack') || ability.includes('atk')) entry.atk = num;
          else if (ability.includes('both')) { entry.atk = num; entry.hp = num; }
          else if (ability.includes('special')) entry.special = num;
          else entry.hp = num;
          entry.reason = 'ability text';
        } else {
          // infer via ability text (support cards ignore explicit pct and use computed range/stage)
          let mode = null;
          if (ability.includes('both')) mode = 'both';
          else if (ability.includes('attack') || ability.includes('atk')) mode = 'single';
          else if (ability.includes('special')) mode = 'special';
          else if (ability.includes('hp') || ability.includes('health')) mode = 'single';
          if (mode) {
            const range = getRangeForRank(c.rank, mode);
            if (range) {
              const [min, max] = range;
              // compute stage-aware value
              const idStr = c.id || '';
              const m = idStr.match(/_(\d{2})$/) || idStr.match(/_(\d+)$/);
              const stage = m ? parseInt(m[1], 10) : 1;
              const base = idStr.replace(/_(?:\d{2}|\d+)$/, '');
              const maxStage = maxStageMap.get(base) || 1;
              let val;
              if (maxStage <= 1) val = Math.round((min + max) / 2);
              else {
                const computed = Math.round(min + (max - min) * (stage / maxStage));
                val = Math.min(max, computed + 1);
              }

              if (mode === 'both') { entry.atk = val; entry.hp = val; }
              else if (mode === 'single') { if (ability.includes('hp') || ability.includes('health')) entry.hp = val; else entry.atk = val; }
              else if (mode === 'special') entry.special = val;
              entry.reason = 'ability inferred';
            }
          }
        }
      } else if (c.type && String(c.type).toLowerCase() === 'support') {
        // default support -> HP
        const range = getRangeForRank(c.rank, 'single');
        if (range) {
          const [min, max] = range;
          const idStr = c.id || '';
          const m = idStr.match(/_(\d{2})$/) || idStr.match(/_(\d+)$/);
          const stage = m ? parseInt(m[1], 10) : 1;
          const base = idStr.replace(/_(?:\d{2}|\d+)$/, '');
          const maxStage = maxStageMap.get(base) || 1;
          let val;
          if (maxStage <= 1) val = Math.round((min + max) / 2);
          else {
            const computed = Math.round(min + (max - min) * (stage / maxStage));
            val = Math.min(max, computed + 1);
          }
          entry.hp = val;
          entry.reason = 'support default';
        }
      }
    }

    totals.atk += entry.atk; totals.hp += entry.hp; totals.special += entry.special;
    details.push(entry);
  }
  return { totals, details };
}
