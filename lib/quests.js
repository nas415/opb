// Quest generation and utility functions
import { randomUUID } from "crypto";

export const QUEST_TYPES = {
  PULL: {
    key: "pull",
    daily: { min: 3, max: 5 },
    weekly: { min: 25, max: 40 },
    format: (n) => `Pull ${n} cards`
  },
  COMPLETE_MISSION: {
    key: "mission",
    daily: { min: 3, max: 3 },
    weekly: { min: 10, max: 20 },
    format: (n) => `Complete ${n} missions`
  },
  WIN_BATTLE: {
    key: "battle",
    daily: { min: 3, max: 5 },
    weekly: { min: 10, max: 20 },
    format: (n) => `Win ${n} battles`
  },
  BUY_ITEM: {
    key: "buy",
    daily: { min: 1, max: 1 },
    weekly: { min: 5, max: 5 },
    format: (n) => `Buy ${n} item${n > 1 ? 's' : ''}`
  },
  SELL_ITEM: {
    key: "sell",
    daily: { min: 1, max: 1 },
    weekly: { min: 1, max: 1 },
    format: (n) => `Sell ${n} item${n > 1 ? 's' : ''}`
  },
  WIN_DUEL: {
    key: "duel",
    daily: { min: 3, max: 5 },
    weekly: { min: 10, max: 20 },
    format: (n) => `Win ${n} duels`
  },
  OPEN_CHEST: {
    key: "chest",
    daily: { min: 3, max: 5 },
    weekly: { min: 10, max: 20 },
    format: (n) => `Open ${n} chests`
  },
  GAMBLE: {
    key: "gamble",
    daily: { min: 3, max: 5 },
    weekly: { min: 10, max: 20 },
    format: (n) => `Gamble ${n} times`
  },
  EVOLVE: {
    key: "evolve",
    daily: null, // daily quests don't include evolve
    weekly: { min: 1, max: 3 },
    format: (n) => `Evolve ${n} card${n > 1 ? 's' : ''}`
  }
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Generate rewards based on quest type
function generateRewards(type) {
  if (type === "daily") {
    const reward = {
      moneyRange: [100, 250],
      chests: { C: 0, B: 0, A: 0 },
      resetTokens: 0
    };

    // Random chest reward based on probabilities
    const roll = Math.random();
    if (roll < 0.75) {
      reward.chests.C = 1;
    } else if (roll < 0.85) {
      reward.chests.C = 2;
    } else if (roll < 0.93) {
      reward.chests.C = 2;
    } else {
      reward.chests.B = 2;
    }

    return reward;
  } else { // weekly
    const reward = {
      moneyRange: [1000, 2000],
      chests: { C: 0, B: 0, A: 0 },
      resetTokens: 0
    };

    // 10% C chest, else B or A rank chest
    const roll = Math.random();
    if (roll < 0.1) {
      reward.chests.C = 1;
    } else if (roll < 0.55) { // 45% B chest
      reward.chests.B = 1;
    } else { // 45% A chest
      reward.chests.A = 1;
    }

    return reward;
  }
}

// Generate a set of quests
export function generateQuests(type) {
  const count = type === "daily" ? 3 : 5;
  const availableTypes = Object.values(QUEST_TYPES).filter(qt => qt[type]);
  const selected = shuffleArray([...availableTypes]).slice(0, count);

  return selected.map(questType => {
    const range = questType[type];
    const target = randomInt(range.min, range.max);

    return {
      id: randomUUID(),
      action: questType.key,
      target,
      description: questType.format(target),
      reward: generateRewards(type)
    };
  });
}

// Calculate rewards for a completed quest
export function calculateQuestRewards(quest) {
  const reward = {
    money: randomInt(quest.reward.moneyRange[0], quest.reward.moneyRange[1]),
    chests: [],
    resetTokens: 0
  };

  // Add chests based on probabilities
  Object.entries(quest.reward.chests).forEach(([rank, count]) => {
    if (count > 0) {
      reward.chests.push({ rank, count });
    }
  });

  // Add reset tokens if probability hits
  if (quest.reward.resetTokens > 0 && Math.random() < quest.reward.resetTokens) {
    reward.resetTokens = 1;
  }

  return reward;
}