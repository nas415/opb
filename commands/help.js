import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const data = new SlashCommandBuilder().setName("help").setDescription("Show bot commands");

export async function execute(interactionOrMessage, client) {
  const isInteraction = typeof interactionOrMessage.isCommand === "function" || typeof interactionOrMessage.isChatInputCommand === "function";
  const user = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
  const channel = isInteraction ? interactionOrMessage.channel : interactionOrMessage.channel;

  // Use a static, curated help listing per design
  const groups = {
    Combat: [
      { name: "team", desc: "view your team" },
      { name: "team add", desc: "add a card to your team" },
      { name: "team remove", desc: "remove a card from your team" },
      { name: "autoteam", desc: "builds the best possible team (powerwise)" },
      { name: "upgrade", desc: "upgrade a card to its next rank" }
    ],
    Economy: [
      { name: "balance", desc: "shows your balance and reset token count" },
      { name: "daily", desc: "claim daily rewards" },
      { name: "gamble", desc: "gamble an amount of beli" },
      { name: "mission", desc: "one piece trivia questions that give you rewards" },
      { name: "quests", desc: "view your daily and weekly quests" },
      { name: "sell", desc: "sell a card or item for beli" }
    ],
    Collection: [
      { name: "info", desc: "view info about a card or item" },
      { name: "pull", desc: "pull a random card" },
      { name: "resetpulls", desc: "resets your card pull count" }
    ],
    General: [
      { name: "help", desc: "shows all bot commands" },
      { name: "inventory", desc: "view your inventory items" },
      { name: "user", desc: "shows your user profile" }
    ]
  };

  // Starter embed (before clicking any buttons)
  const embed = new EmbedBuilder()
    .setTitle("Bot Commands")
    .setColor(0xFFFFFF)
    .setDescription("Click a category below to view its commands.")
    .setFooter({ text: `Requested by ${user.username}`, iconURL: user.displayAvatarURL() });

  // build dynamic category buttons (chunked into rows of up to 5)
  const categories = [
    { key: "COMBAT", label: "Combat" },
    { key: "ECONOMY", label: "Economy" },
    { key: "COLLECTION", label: "Collection" },
    { key: "GENERAL", label: "General" }
  ];

  const buttons = categories.map(cat => new ButtonBuilder()
    .setCustomId(`help_cat:${cat.key}:${user.id}`)
    .setLabel(cat.label)
    .setStyle(ButtonStyle.Secondary)
  );

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    const slice = buttons.slice(i, i + 5);
    const row = new ActionRowBuilder().addComponents(...slice);
    rows.push(row);
  }

  if (isInteraction) {
    await interactionOrMessage.reply({ embeds: [embed], components: rows });
  } else {
    await channel.send({ embeds: [embed], components: rows });
  }
}

export const description = "Show bot commands (grouped)";
