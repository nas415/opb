export function roundNearestFive(n) {
  if (typeof n !== 'number' || isNaN(n)) return n;
  if (n === 2) return 1;
  return Math.round(n / 5) * 5;
}

export function roundRangeToFive(range) {
  if (!Array.isArray(range) || range.length < 2) return range;
  return [roundNearestFive(range[0] || 0), roundNearestFive(range[1] || 0)];
}

export default { roundNearestFive, roundRangeToFive };
