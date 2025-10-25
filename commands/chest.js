import { SlashCommandBuilder } from 'discord.js';
import Inventory from '../models/Inventory.js';
import Balance from '../models/Balance.js';
import { getChestRewards, RANKS } from '../lib/chests.js';

export default {
  data: new SlashCommandBuilder()
    .setName('chest')
    .setDescription('Open chests to get rewards')
    .addStringOption(option =>
      option.setName('rank')
        .setDescription('The rank of chest to open (C, B, or A)')
        .setRequired(true)
        .addChoices(
          { name: 'C Rank', value: 'C' },
          { name: 'B Rank', value: 'B' },
          { name: 'A Rank', value: 'A' }
        ))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of chests to open')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10)),

  async execute(interaction) {
    const rank = interaction.options.getString('rank');
    const amount = interaction.options.getInteger('amount');

    let inventory = await Inventory.findOne({ userId: interaction.user.id });
    if (!inventory) {
      inventory = new Inventory({ userId: interaction.user.id });
    }

    if (!inventory.chests[rank] || inventory.chests[rank] < amount) {
      await interaction.reply(`❌ You don't have enough ${rank} rank chests! You have: ${inventory.chests[rank] || 0}`);
      return;
    }

    let totalYen = 0;
    let totalBottles = 0;

    for (let i = 0; i < amount; i++) {
      const rewards = getChestRewards(rank);
      totalYen += rewards.yen;
      totalBottles += rewards.xpBottles;
    }

    inventory.chests[rank] -= amount;
    inventory.xpBottles = (inventory.xpBottles || 0) + totalBottles;
    await inventory.save();

    let balance = await Balance.findOne({ userId: interaction.user.id });
    if (!balance) {
      balance = new Balance({ userId: interaction.user.id });
    }
    balance.amount += totalYen;
    await balance.save();

    await interaction.reply(`✨ You opened ${amount} ${rank} rank chest${amount > 1 ? 's' : ''} and got:\n` +
      `💰 ${totalYen}¥\n` +
      `🍾 ${totalBottles} XP Bottle${totalBottles > 1 ? 's' : ''}\n\n` +
      `Remaining ${rank} rank chests: ${inventory.chests[rank]}\n` +
      `Total XP Bottles: ${inventory.xpBottles}\n` +
      `New Balance: ${balance.amount}¥`);
  }
};