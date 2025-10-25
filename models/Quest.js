import mongoose from "mongoose";

const QuestSchema = new mongoose.Schema({
  type: { type: String, enum: ["daily", "weekly"], required: true },
  generatedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  quests: [{
    id: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: Number, required: true },
    description: { type: String, required: true },
    reward: {
      moneyRange: { type: [Number], required: true }, // [min, max]
      chests: {
        C: { type: Number, default: 0 }, // probability 0-1
        B: { type: Number, default: 0 },
        A: { type: Number, default: 0 }
      },
      resetTokens: { type: Number, default: 0 } // probability 0-1
    }
  }],
  progress: { type: Map, of: {
    type: Map,
    of: {
      current: { type: Number, default: 0 },
      claimed: { type: Boolean, default: false }
    }
  }, default: {} }, // userId -> questId -> {current, claimed}
});

// static method to get or generate quests for a type
QuestSchema.statics.getCurrentQuests = async function(type) {
  const now = new Date();
  let current = await this.findOne({
    type,
    expiresAt: { $gt: now }
  });

  if (!current) {
    // Generate new quest set
    const expiresAt = new Date();
    if (type === "daily") {
      expiresAt.setUTCHours(24, 0, 0, 0); // Next UTC midnight
    } else {
      // Weekly - expire next Monday at UTC midnight
      expiresAt.setUTCDate(expiresAt.getUTCDate() + (8 - expiresAt.getUTCDay())); // 8 = next Monday
      expiresAt.setUTCHours(0, 0, 0, 0);
    }

    current = await this.create({
      type,
      generatedAt: now,
      expiresAt,
      quests: [] // Will be populated by generator
    });
  }

  return current;
};

// Get user's quest progress
QuestSchema.methods.getUserProgress = function(userId) {
  return this.progress.get(userId) || new Map();
};

// Record progress for an action
QuestSchema.methods.recordAction = async function(userId, action, amount = 1) {
  const userProgress = this.getUserProgress(userId);
  let updated = false;

  for (const quest of this.quests) {
    if (quest.action !== action) continue;
    
    const questProgress = userProgress.get(quest.id) || { current: 0, claimed: false };
    if (questProgress.claimed) continue;

    questProgress.current = Math.min(quest.target, (questProgress.current || 0) + amount);
    userProgress.set(quest.id, questProgress);
    updated = true;
  }

  if (updated) {
    this.progress.set(userId, userProgress);
    await this.save();
  }

  return this;
};

// Check if a quest is completed
QuestSchema.methods.isQuestCompleted = function(userId, questId) {
  const progress = this.getUserProgress(userId).get(questId);
  if (!progress) return false;
  
  const quest = this.quests.find(q => q.id === questId);
  if (!quest) return false;

  return progress.current >= quest.target && !progress.claimed;
};

export default mongoose.models.Quest || mongoose.model("Quest", QuestSchema);