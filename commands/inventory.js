import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import Inventory from "../models/Inventory.js";

export const data = new SlashCommandBuilder().setName("inventory").setDescription("View your inventory/items");
export const aliases = ["inv"];

export async function execute(interactionOrMessage, client) {
  const isInteraction = typeof interactionOrMessage.isCommand === "function" || typeof interactionOrMessage.isChatInputCommand === "function";
  const user = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
  const channel = isInteraction ? interactionOrMessage.channel : interactionOrMessage.channel;
  const userId = user.id;

  let inv = await Inventory.findOne({ userId });
  if (!inv) {
    inv = new Inventory({ userId, items: { reset_token: 5 } });
    await inv.save();
  }

  const tokens = Number(inv.items.get("reset_token") || 0);

  const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Inventory`)
    .setColor(0xFFFFFF)
    .setDescription("Items you own — icons can be added later.")
    .setThumbnail(user.displayAvatarURL());

  if (isInteraction) return interactionOrMessage.reply({ embeds: [embed] });
  return channel.send({ embeds: [embed] });
}
