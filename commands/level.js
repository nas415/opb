import { SlashCommandBuilder } from 'discord.js';
import Progress from '../models/Progress.js';
import Inventory from '../models/Inventory.js';
import { fuzzyFindCard } from '../lib/cardEmbed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Use XP bottles to level up a card')
    .addStringOption(option =>
      option.setName('card')
        .setDescription('The card to level up')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('bottles')
        .setDescription('Number of XP bottles to use')
        .setRequired(true)
        .setMinValue(1)),

  async execute(interaction) {
    const cardName = interaction.options.getString('card');
    const bottles = interaction.options.getInteger('bottles');

    const card = fuzzyFindCard(cardName);
    if (!card) {
      await interaction.reply(`❌ Card not found for query: ${cardName}`);
      return;
    }

    let inventory = await Inventory.findOne({ userId: interaction.user.id });
    if (!inventory) {
      inventory = new Inventory({ userId: interaction.user.id });
    }

    if (!inventory.xpBottles || inventory.xpBottles < bottles) {
      await interaction.reply(`❌ You don't have enough XP bottles! You have: ${inventory.xpBottles || 0}`);
      return;
    }

    let progress = await Progress.findOne({ userId: interaction.user.id });
    if (!progress) {
      progress = new Progress({ userId: interaction.user.id });
    }

    const cardsMap = progress.cards instanceof Map ? progress.cards : new Map(Object.entries(progress.cards || {}));
    const entry = cardsMap.get(card.id) || { count: 0, xp: 0, level: 0 };

    if (!entry.count) {
      await interaction.reply(`❌ You don't own this card!`);
      return;
    }

    const xpToAdd = bottles * 10;
    entry.xp = (entry.xp || 0) + xpToAdd;
    
    // Calculate new level (100 XP per level)
    entry.level = Math.floor(entry.xp / 100);

    cardsMap.set(card.id, entry);
    progress.cards = Object.fromEntries(cardsMap);
    await progress.save();

    inventory.xpBottles -= bottles;
    await inventory.save();

    await interaction.reply(
      `✨ Added ${xpToAdd} XP to ${card.name}\n` +
      `Current XP: ${entry.xp}\n` +
      `Current Level: ${entry.level}\n` +
      `Remaining XP Bottles: ${inventory.xpBottles}`
    );
  }
};