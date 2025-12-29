import { SlashCommandBuilder } from "discord.js";
import { pages, buildEmbed, buildRow } from "../lib/shopPages.js";

export const data = new SlashCommandBuilder()
  .setName("shop")
  .setDescription("Show the item shop");

export async function execute(interactionOrMessage) {
  const isInteraction = interactionOrMessage && typeof interactionOrMessage.isChatInputCommand === "function";
  const user = isInteraction ? interactionOrMessage.user : (interactionOrMessage?.author || null);
  const channel = isInteraction
    ? (interactionOrMessage.channel || (interactionOrMessage.guild ? await interactionOrMessage.guild.channels.fetch(interactionOrMessage.channelId).catch(() => null) : null))
    : (interactionOrMessage?.channel || null);

  if (!user || !channel) {
    if (isInteraction) {
      try { if (!interactionOrMessage.replied) await interactionOrMessage.reply({ content: 'Unable to open shop (no channel).', ephemeral: true }); } catch (e) {}
    }
    return;
  }

  const pageIndex = 0;
  const embed = buildEmbed(pages[pageIndex]);
  const row = buildRow(user.id, pageIndex);

  try {
    if (isInteraction) {
      try { await interactionOrMessage.reply({ content: 'Opening shop...', ephemeral: true }); } catch (e) {}
    }
    const msg = await channel.send({ embeds: [embed], components: [row] });
    try { console.log(`[shop] opened by ${user.id} msg=${msg.id}`); } catch (e) {}
  } catch (err) {
    console.error('[shop] send failed:', err && err.message ? err.message : err);
    if (isInteraction) {
      try { if (!interactionOrMessage.replied) await interactionOrMessage.reply({ content: 'Unable to open shop.', ephemeral: true }); } catch (e) {}
    }
  }
}

export const category = "Shop";
export const description = "Open the item shop";
