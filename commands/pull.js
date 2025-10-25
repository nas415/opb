import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getRandomCardByProbability, getRankInfo } from "../cards.js";
import Pull from "../models/Pull.js";
import Progress from "../models/Progress.js";
const WINDOW_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_PULLS = 7;

const RANK_XP = {
  C: 20,
  B: 50,
  A: 75,
  S: 100,
};

// default probabilities (percentages)
const PULL_PROBABILITIES = { C: 50, B: 30, A: 15, S: 3, ITEM: 2 };

// MongoDB (mongoose) is used for persistence via models/Pull.js and models/Progress.js

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

export const data = new SlashCommandBuilder().setName("pull").setDescription("Pull a card (7 pulls per 8h reset)");

export async function execute(interactionOrMessage, client) {
  // determine if this is an interaction or a message
  const isInteraction = typeof interactionOrMessage.isCommand === "function" || typeof interactionOrMessage.isChatInputCommand === "function";
  const user = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
  const channel = isInteraction ? interactionOrMessage.channel : interactionOrMessage.channel;
  const userId = user.id;

  const currentWindow = Math.floor(Date.now() / WINDOW_MS);

  // load or initialize Pull document for this user
  let pullDoc = await Pull.findOne({ userId });
  if (!pullDoc || pullDoc.window !== currentWindow) {
    // start a new window
    pullDoc = await Pull.findOneAndUpdate(
      { userId },
      { userId, window: currentWindow, used: 0 },
      { upsert: true, new: true }
    );
  }

  if (pullDoc.used >= MAX_PULLS) {
    const nextReset = (pullDoc.window + 1) * WINDOW_MS;
    const timeLeft = nextReset - Date.now();
    const reply = `You've used all ${MAX_PULLS} pulls. Next reset in \`${formatTime(timeLeft)}\`.`;
    if (isInteraction) {
      await interactionOrMessage.reply({ content: reply, ephemeral: true });
    } else {
      await channel.send(reply);
    }
    return;
  }

  // consume one pull (respecting existing window)
  if (pullDoc.window !== currentWindow) {
    pullDoc.window = currentWindow;
    pullDoc.used = 1;
  } else {
    pullDoc.used += 1;
  }
  await pullDoc.save();

  // perform pull (probability-driven)
  const pulled = getRandomCardByProbability(PULL_PROBABILITIES);

  // ensure user's progress document
  let progDoc = await Progress.findOne({ userId });
  if (!progDoc) {
    progDoc = new Progress({ userId, cards: {} });
  }

  // progDoc.cards may be a Mongoose Map or a plain object; normalize to a Map
  let userCardsMap;
  if (progDoc.cards instanceof Map) {
    userCardsMap = progDoc.cards;
  } else {
    // convert plain object to Map
    userCardsMap = new Map(Object.entries(progDoc.cards || {}));
  }

  let description = "";
  let footer = `Pull ${pullDoc.used}/${MAX_PULLS} • ${pulled.type === "Attack" ? "Attacking Card" : (pulled.type || "-")}`;

  // check duplicate -> convert to XP
  // read existing entry from Map
  const existing = userCardsMap.get(pulled.id);
  if (existing && existing.count > 0) {
    const xpGain = RANK_XP[pulled.rank.toUpperCase()] || 0;
    existing.xp = (existing.xp || 0) + xpGain;
    description = `You pulled **${pulled.name}** again — converted to **${xpGain} XP**.`;

    // level up
    let leveled = false;
    while ((existing.xp || 0) >= 100) {
      existing.xp -= 100;
      existing.level = (existing.level || 0) + 1;
      leveled = true;
    }
    if (leveled) description += ` Your card leveled up to level ${existing.level}!`;
    userCardsMap.set(pulled.id, existing);
  } else {
    const newEntry = { count: 1, xp: 0, level: 0, acquiredAt: Date.now() };
    userCardsMap.set(pulled.id, newEntry);
    description = `You pulled **${pulled.name}** — added to your collection!`;
  }

  // write back to progress doc (store as plain object to avoid Map persistence quirks)
  progDoc.cards = Object.fromEntries(userCardsMap);
  await progDoc.save();

  // Update quest progress
  const Quest = (await import("../models/Quest.js")).default;
  const [dailyQuests, weeklyQuests] = await Promise.all([
    Quest.getCurrentQuests("daily"),
    Quest.getCurrentQuests("weekly")
  ]);

  await Promise.all([
    dailyQuests.recordAction(userId, "pull", 1),
    weeklyQuests.recordAction(userId, "pull", 1)
  ]);

  // Show base stats (level 1) for card pull embed
  const effectivePower = pulled.power;
  const effectiveAttackMin = pulled.attackRange[0];
  const effectiveAttackMax = pulled.attackRange[1];
  const effectiveHealth = pulled.health || 0;

  // build embed similar to the provided image layout
  const rankInfo = getRankInfo(pulled.rank);

  // build compact 2x2 embed layout without level display
  const statsText = `**Power:** ${effectivePower}
**Attack:** ${effectiveAttackMin} - ${effectiveAttackMax}
**Health:** ${effectiveHealth}
**Effect:** ${pulled.ability ? pulled.ability : "None"}`;

  const embed = new EmbedBuilder()
    .setTitle(pulled.name)
    .setColor(rankInfo?.color || 0x1abc9c)
    .setDescription(`${description}\n\n${statsText}`)
    .setFooter({ text: footer, iconURL: user.displayAvatarURL() });

  // leave space for rank icon and card image — if you paste URLs into the card definitions (cards.js)
  // rank icon comes from rank info map
  if (rankInfo?.icon) embed.setThumbnail(rankInfo.icon);
  if (pulled.image) embed.setImage(pulled.image);

  if (isInteraction) {
    await interactionOrMessage.reply({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}
