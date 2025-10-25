import { SlashCommandBuilder } from "discord.js";
import * as balanceModule from "./balance.js";

export const data = new SlashCommandBuilder().setName("bal").setDescription("Alias for /balance");

export async function execute(interactionOrMessage, client) {
  // delegate to balance module
  await balanceModule.execute(interactionOrMessage, client);
}
