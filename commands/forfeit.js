import { SlashCommandBuilder } from "discord.js";
import * as Duel from "./duel.js";

export const data = new SlashCommandBuilder()
  .setName("forfeit")
  .setDescription("Forfeit your current duel match (you lose and your opponent wins)");

export async function execute(interactionOrMessage, client) {
  const isInteraction = typeof interactionOrMessage.isCommand === "function" || typeof interactionOrMessage.isChatInputCommand === "function";
  const user = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
  const channel = isInteraction ? interactionOrMessage.channel : interactionOrMessage.channel;
  const ok = await Duel.forfeitByUser(user.id, channel, isInteraction ? interactionOrMessage : null);
  if (!ok) {
    const reply = "You're not currently in an active duel.";
    if (isInteraction) return interactionOrMessage.reply({ content: reply, ephemeral: true });
    return channel.send(reply);
  }
  if (isInteraction) return interactionOrMessage.reply({ content: "You forfeited the duel.", ephemeral: true });
  return channel.send("You forfeited the duel.");
}

export const description = "Forfeit your current duel (prefix: `op forfeit`)";

export const aliases = ["forfeit"];
