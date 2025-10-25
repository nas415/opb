import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import fs from "fs";

config();

const commands = [];
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  // Only include commands that expose a SlashCommandBuilder (has toJSON)
  if (command && command.data && typeof command.data.toJSON === "function") {
    commands.push(command.data.toJSON());
  } else {
    console.log(`Skipping non-slash command or missing data.toJSON: ${file}`);
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

try {
  console.log("🌀 Registering slash commands...");
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
  console.log("✅ Successfully registered commands!");
} catch (error) {
  console.error(error);
}
