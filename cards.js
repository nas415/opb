// cards.js
// Centralized card and rank definitions

export const RANKS = {
  C: { name: "C", color: 0x95a5a6, icon: "https://files.catbox.moe/8gn79p.png", value: 1 },
  B: { name: "B", color: 0x3498db, icon: "https://files.catbox.moe/rv1frd.png", value: 2 },
  A: { name: "A", color: 0x9b59b6, icon: "https://files.catbox.moe/ussec9.webp", value: 3 },
  S: { name: "S", color: 0xe74c3c, icon: "https://files.catbox.moe/wrx7hl.png", value: 4 },
  SS: { name: "SS", color: 0xFF8C00, icon: null, value: 5 }, // dark orange
  UR: { name: "UR", color: 0x8B0000, icon: null, value: 6 }, // dark red
};

export const cards = [
  {
    id: "luffy_b_01",
    name: "Monkey D. Luffy",
    title: "The man of freedom",
    rank: "B",
    power: 60,
    attackRange: [16, 24],
    health: 140,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/24a5fq.jpg",
    evolutions: ["luffy_a_02"],
  },
  {
    id: "luffy_a_02",
    name: "Monkey D. Luffy",
    title: "Captain of the Strawhat Pirates",
    rank: "A",
    power: 160,
    attackRange: [26, 44],
    health: 210,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/hkxjpn.jpg",
    evolutions: ["luffy_s_03"],
    isUpgrade: true,
    upgradeRequirements: { cost: 2000, minLevel: 20 },
  },
  {
    id: "luffy_s_03",
    name: "Monkey D. Luffy",
    title: "Worst generation pirate",
    rank: "S",
    power: 300,
    attackRange: [30, 70],
    health: 310,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/l6s82l.jpg",
    evolutions: ["luffy_ur_04"],
    isUpgrade: true,
    upgradeRequirements: { cost: 5000, minLevel: 35 },
  },
  {
    id: "shanks_s_01",
    name: "Shanks",
    title: "Captain of the Red-Haired pirates",
    rank: "S",
    power: 300,
    attackRange: [30, 60],
    health: 300,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/d7vn4a.jpg",
    evolutions: [],
  },
  // New additions
  {
    id: "luffy_ur_04",
    name: "Monkey D. Luffy",
    title: "The Warrior of Liberation",
    rank: "UR",
    power: 1150,
    attackRange: [120, 170],
    health: 780,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/ppdc69.jpg", // placeholder
    evolutions: [],
    isUpgrade: true,
    upgradeRequirements: { cost: 100000, minLevel: 100 },
  },
  {
    id: "shanks_ur_02",
    name: "Shanks",
    title: "Emperor of the New Era",
    rank: "UR",
    power: 1000,
    attackRange: [100, 150],
    health: 700,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/7iqdjj.jpg", // placeholder
    evolutions: [],
    isUpgrade: true,
    upgradeRequirements: { cost: 30000, minLevel: 75 },
  },
  {
    id: "zoro_b_01",
    name: "Roronoa Zoro",
    title: "Moss head",
    rank: "B",
    power: 70,
    attackRange: [20, 30],
    health: 140,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/xsiawi.jpg",
    evolutions: ["zoro_s_02"],
  },
  {
    id: "zoro_s_02",
    name: "Roronoa Zoro",
    title: "Pirate hunter",
    rank: "S",
    power: 200,
    attackRange: [30, 50],
    health: 250,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/ln2a8x.jpg",
    evolutions: ["zoro_ss_03"],
    isUpgrade: true,
    upgradeRequirements: { cost: 7500, minLevel: 40 },
  },
  {
    id: "zoro_ss_03",
    name: "Roronoa Zoro",
    title: "King of hell",
    rank: "SS",
    power: 350,
    attackRange: [60, 100],
    health: 350,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/z02f87.jpg",
    evolutions: [],
    isUpgrade: true,
    upgradeRequirements: { cost: 20000, minLevel: 60 },
  },
  {
    id: "beckman_a_01",
    name: "Benn Beckman",
    title: "First Mate of the Red-Haired pirates",
    rank: "A",
    power: 180,
    attackRange: [25, 38],
    health: 215,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/0xnjto.jpg",
    evolutions: ["beckman_s_02"],
  },
  {
    id: "beckman_s_02",
    name: "Benn Beckman",
    title: "High-Ranking Yonko Commander",
    rank: "S",
    power: 226,
    attackRange: [33, 62],
    health: 240,
    type: "Attack",
    ability: null,
    image: "https://files.catbox.moe/12j3d0.jpg",
    evolutions: [],
    isUpgrade: true,
    upgradeRequirements: { cost: 7500, minLevel: 40 },
  },
];

export function getCardById(id) {
  return cards.find((c) => c.id === id) || null;
}

// Probability-driven random card selection
// probabilities is an object with rank keys -> percentage (summing to 100)
export function getRandomCardByProbability(probabilities = { C: 50, B: 30, A: 15, S: 3, ITEM: 2 }) {
  const entries = Object.entries(probabilities);
  const rnd = Math.random() * 100;
  let acc = 0;
  let chosenRank = null;
  for (const [rank, pct] of entries) {
    acc += pct;
    if (rnd <= acc) {
      chosenRank = rank;
      break;
    }
  }
  if (!chosenRank || chosenRank === "ITEM") chosenRank = "C";
  // exclude upgraded versions from pulls
  const pool = cards.filter((c) => !c.isUpgrade && c.rank && c.rank.toUpperCase() === String(chosenRank).toUpperCase());
  if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  // fallback should also exclude upgrade variants so evolved cards are never pullable
  const fallback = cards.filter((c) => !c.isUpgrade && c.rank && c.rank.toUpperCase() !== "ITEM");
  if (fallback.length > 0) return fallback[Math.floor(Math.random() * fallback.length)];
  const nonUpgrade = cards.filter((c) => !c.isUpgrade);
  return nonUpgrade.length > 0 ? nonUpgrade[Math.floor(Math.random() * nonUpgrade.length)] : cards[Math.floor(Math.random() * cards.length)];
}

export function getRankInfo(rank) {
  return RANKS[String(rank).toUpperCase()] || null;
}
