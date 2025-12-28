import { cards } from '../cards.js';

const missing = cards
  .map((c, i) => ({ ...c, index: i }))
  .filter(c => c.type === 'Support' && (!c.ability || !c.boost))
  .map(c => ({ id: c.id, rank: c.rank, ability: c.ability, boost: c.boost, index: c.index }));

if (missing.length === 0) {
  console.log('All Support cards have ability and boost fields.');
} else {
  console.log(`Found ${missing.length} support cards missing ability/boost:`);
  for (const m of missing) {
    console.log(JSON.stringify(m));
  }
}
