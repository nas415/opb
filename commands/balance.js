import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import Balance from "../models/Balance.js";

// placeholder for your custom currency emoji. Set to a string like '<:yen:12345>'
const CURRENCY_EMOJI = null;
const CURRENCY_SYMBOL = "¥";

export const data = new SlashCommandBuilder().setName("balance").setDescription("Show your balance");

export async function execute(interactionOrMessage, client) {
  const isInteraction = typeof interactionOrMessage.isCommand === "function" || typeof interactionOrMessage.isChatInputCommand === "function";
  const user = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
  const channel = isInteraction ? interactionOrMessage.channel : interactionOrMessage.channel;
  const userId = user.id;

  let bal = await Balance.findOne({ userId });
  if (!bal) {
    bal = new Balance({ userId, amount: 500 });
    await bal.save();
  }

  const emoji = CURRENCY_EMOJI ? `${CURRENCY_EMOJI} ` : "";
  const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Balance`)
    .setColor(0xFFFFFF)
    .addFields(
      { name: "Balance", value: `${emoji}${CURRENCY_SYMBOL} ${bal.amount}`, inline: true },
      { name: "Reset Tokens", value: `${bal.resetTokens || 0}`, inline: true }
    )
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: "Currency: earned via quests, gambling, selling cards (TODO)" });

  if (isInteraction) {
    await interactionOrMessage.reply({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}
