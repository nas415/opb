export function getChestRewards(rank) {
  switch (rank.toUpperCase()) {
    case 'C':
      return {
        yen: Math.floor(Math.random() * 401) + 100, // 100-500
        xpBottles: Math.floor(Math.random() * 3) + 1 // 1-3
      };
    case 'B':
      return {
        yen: Math.floor(Math.random() * 751) + 250, // 250-1000
        xpBottles: Math.floor(Math.random() * 4) + 2 // 2-5
      };
    case 'A':
      return {
        yen: Math.floor(Math.random() * 1001) + 1000, // 1000-2000
        xpBottles: Math.floor(Math.random() * 6) + 5 // 5-10
      };
    default:
      throw new Error('Invalid chest rank');
  }
}

export const RANKS = ['C', 'B', 'A'];