import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import Progress from "../models/Progress.js";
import { cards, getCardById } from "../cards.js";
import { buildCardEmbed } from "../lib/cardEmbed.js";

function getEvolutionChain(rootCard) {
  const chain = [];
  const visited = new Set();
  function walk(card) {
    if (!card || visited.has(card.id)) return;
    visited.add(card.id);
    chain.push(card.id);
    const ev = card.evolutions || [];
    for (const nextId of ev) {
      const next = getCardById(nextId);
      if (next) walk(next);
    }
  }
  walk(rootCard);
  return chain;
}

function fuzzyFindCard(query) {
  if (!query) return null;
  const q = String(query).toLowerCase();
  // exact id
  let card = cards.find((c) => c.id.toLowerCase() === q);
  if (card) return card;
  // exact name
  card = cards.find((c) => c.name.toLowerCase() === q);
  if (card) return card;
  // startsWith name
  card = cards.find((c) => c.name.toLowerCase().startsWith(q));
  if (card) return card;
  // includes
  card = cards.find((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  return card || null;
}

// use shared embed builder

export const data = new SlashCommandBuilder()
  .setName("info")
  .setDescription("View a card's info")
  .addStringOption((opt) => opt.setName("card").setDescription("Card id or name").setRequired(true));

export async function execute(interactionOrMessage, client) {
  const isInteraction = typeof interactionOrMessage.isCommand === "function" || typeof interactionOrMessage.isChatInputCommand === "function";
  const user = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
  const channel = isInteraction ? interactionOrMessage.channel : interactionOrMessage.channel;
  const userId = user.id;

  // get query
  let query;
  if (isInteraction) {
    query = interactionOrMessage.options.getString("card");
  } else {
    // message content: op info <query...>
    const parts = interactionOrMessage.content.trim().split(/\s+/);
    parts.splice(0, 2); // remove prefix and command
    query = parts.join(" ");
  }

  const card = fuzzyFindCard(query);
  if (!card) {
    const reply = `No card matching "${query}" found.`;
    if (isInteraction) await interactionOrMessage.reply({ content: reply, ephemeral: true });
    else await channel.send(reply);
    return;
  }

  // fetch progress to check ownership
  const progDoc = await Progress.findOne({ userId });
  const cardsMap = progDoc ? (progDoc.cards instanceof Map ? progDoc.cards : new Map(Object.entries(progDoc.cards || {}))) : new Map();
  // robust ownership lookup: try exact key, lowercase key, and substring matches
  let ownedEntry = null;
  if (cardsMap instanceof Map) {
    ownedEntry = cardsMap.get(card.id) || cardsMap.get(String(card.id).toLowerCase()) || null;
    if (!ownedEntry) {
      for (const [k, v] of cardsMap.entries()) {
        if (String(k).toLowerCase() === String(card.id).toLowerCase() || String(k).toLowerCase().includes(String(card.id).toLowerCase())) {
          ownedEntry = v; break;
        }
      }
    }
  } else {
    // object case (shouldn't normally happen here), but handle defensively
    const obj = Object.fromEntries(cardsMap instanceof Map ? cardsMap : (Object.entries(cardsMap || {})));
    ownedEntry = obj[card.id] || obj[String(card.id).toLowerCase()] || null;
    if (!ownedEntry) {
      for (const k of Object.keys(obj)) {
        if (String(k).toLowerCase() === String(card.id).toLowerCase() || String(k).toLowerCase().includes(String(card.id).toLowerCase())) {
          ownedEntry = obj[k]; break;
        }
      }
    }
  }

  const embed = buildCardEmbed(card, ownedEntry, user);

  // if not owned, make it grey and show NOT OWNED prominently
  if (!ownedEntry || (ownedEntry.count || 0) <= 0) {
    embed.setColor(0x2f3136);
    embed.setDescription("**NOT OWNED**");
  }

  // build evolution chain (root then recursive evolutions)
  const chain = getEvolutionChain(card);
  const len = chain.length;
  let row = null;
  if (len > 1) {
    // initial index is 0 (showing root card)
    const idx = 0;
    const prevIndex = (idx - 1 + len) % len;
    const nextIndex = (idx + 1) % len;
    // customIds use info_prev/info_next with target index to avoid duplicate ids
    const prevId = `info_prev:${userId}:${card.id}:${prevIndex}`;
    const nextId = `info_next:${userId}:${card.id}:${nextIndex}`;
    row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(prevId).setLabel("Previous").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(nextId).setLabel("Next").setStyle(ButtonStyle.Secondary)
    );
  }

  if (isInteraction) {
    if (row) await interactionOrMessage.reply({ embeds: [embed], components: [row] });
    else await interactionOrMessage.reply({ embeds: [embed] });
  } else {
    if (row) await channel.send({ embeds: [embed], components: [row] });
    else await channel.send({ embeds: [embed] });
  }
}
