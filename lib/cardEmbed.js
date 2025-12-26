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
  // Show base card stats (no level multipliers)
  const basePower = Math.round(card.power || 0);
  const baseAttackMin = Math.round((card.attackRange?.[0] || 0));
  const baseAttackMax = Math.round((card.attackRange?.[1] || 0));
  const baseHealth = Math.round(card.health || 0);

  const rankInfo = getRankInfo(card.rank);

  const statsText = `**Power:** ${basePower}\n**Attack:** ${baseAttackMin} - ${baseAttackMax}\n**Health:** ${baseHealth}\n**Effect:** ${card.ability ? card.ability : "None"}`;

  // 'Obtained from' should be normal text in the description
  const obtained = card.source || "Card Pulls";
  const owned = !!(ownedEntry && (ownedEntry.count || 0) > 0);
  const ownedText = `Owned: ${owned ? 'Yes' : 'No'}`;

  const descParts = [];
  if (card.title) descParts.push(card.title);
  if (owned) descParts.push(`Obtained from: ${obtained}`);
  descParts.push(ownedText);
  descParts.push("");
  descParts.push(statsText);

  const embed = new EmbedBuilder()
    .setTitle(card.name)
    .setColor(rankInfo?.color || 0x808080)
    .setDescription(descParts.join("\n"));

  if (card.image) embed.setImage(card.image);
  if (rankInfo?.icon) embed.setThumbnail(rankInfo.icon);

  // Determine upgrade position among same-name cards
  const same = cards.filter(c => (c.name || "").toLowerCase() === (card.name || "").toLowerCase());
  let footerText = card.name;
  if (same.length > 1) {
    // try to sort by rank value if available
    const sorted = same.slice().sort((a,b) => {
      const va = getRankInfo(a.rank)?.value || 0;
      const vb = getRankInfo(b.rank)?.value || 0;
      return va - vb;
    });
    const idx = sorted.findIndex(c => c.id === card.id);
    if (idx !== -1) footerText = `${card.name} • Upgrade ${idx+1}/${sorted.length}`;
  }

  if (viewer && typeof viewer.displayAvatarURL === 'function') embed.setFooter({ text: footerText, iconURL: viewer.displayAvatarURL() });
  else embed.setFooter({ text: footerText });

  return embed;
}
