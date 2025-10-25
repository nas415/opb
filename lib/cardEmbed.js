import { EmbedBuilder } from "discord.js";
import { getRankInfo } from "../cards.js";
import { cards } from "../cards.js";

export function fuzzyFindCard(query) {
  if (!query) return null;
  const q = String(query).toLowerCase();
  let card = cards.find((c) => c.id.toLowerCase() === q);
  if (card) return card;
  card = cards.find((c) => c.name.toLowerCase() === q);
  if (card) return card;
  card = cards.find((c) => c.name.toLowerCase().startsWith(q));
  if (card) return card;
  card = cards.find((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  return card || null;
}

export function buildCardEmbed(card, ownedEntry, viewer) {
  const level = ownedEntry?.level || 0;
  const multiplier = 1 + level * 0.01;
  const effectivePower = Math.round(card.power * multiplier);
  const effectiveAttackMin = Math.round(card.attackRange[0] * multiplier);
  const effectiveAttackMax = Math.round(card.attackRange[1] * multiplier);
  const effectiveHealth = Math.round((card.health || 0) * multiplier);

  const rankInfo = getRankInfo(card.rank);

  const title = `${card.name} (Lv ${level})`;
  const statsText = `**Power:** ${effectivePower}\n**Attack:** ${effectiveAttackMin} - ${effectiveAttackMax}\n**Health:** ${effectiveHealth}\n**Effect:** ${card.ability ? card.ability : "None"}`;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(rankInfo?.color || 0x808080)
    .setDescription(`${card.title || ""}\n\n${statsText}`);

  if (card.image) embed.setImage(card.image);
  if (rankInfo?.icon) embed.setThumbnail(rankInfo.icon);

  const footerText = `Source: Card Pulls • ID: ${card.id}`;
  if (viewer && viewer.displayAvatarURL) embed.setFooter({ text: footerText, iconURL: viewer.displayAvatarURL() });
  else embed.setFooter({ text: footerText });

  return embed;
}
