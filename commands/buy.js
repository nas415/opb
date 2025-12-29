import { SlashCommandBuilder } from "discord.js";
import Balance from "../models/Balance.js";
import Inventory from "../models/Inventory.js";

export const data = new SlashCommandBuilder()
  .setName("buy")
  .setDescription("Buy an item from the shop")
  .addStringOption(opt => opt.setName("item").setDescription("Item name").setRequired(true))
  .addIntegerOption(opt => opt.setName("amount").setDescription("Amount to buy").setMinValue(1));

const SHOP = {
  chests: { C: 100, B: 250, A: 500, S: 2000 },
  materials: {
    steel: 20, iron: 15, wood: 5, leather: 30, "ray skin": 100, titanium: 200, obsidian: 150, spring: 10, aluminum: 25, brass: 15, diamond: 500
  },
  legendary: {
    "log pose": 5000, map: 3000, "gold bar": 10000, "jolly roger flag": 4000, "crew contract": 8000, "ancient relic": 12000, "s rank summon": 15000, awakening: 20000
  },
  others: {
    "reset token": 1000, "xp book": 250, "xp scroll": 150, "battle token": 50
  }
};

function findItem(name) {
  if (!name) return null;
  const n = String(name).toLowerCase();
  // chests
  if (["c tier chest","c chest","c tier","c"].includes(n) || n === "c tier chest" || n === "c tier") return { type: 'chest', key: 'C', price: SHOP.chests.C };
  if (["b tier chest","b chest","b tier","b"].includes(n)) return { type: 'chest', key: 'B', price: SHOP.chests.B };
  if (["a tier chest","a chest","a tier","a"].includes(n)) return { type: 'chest', key: 'A', price: SHOP.chests.A };
  if (["s tier chest","s chest","s tier","s"].includes(n)) return { type: 'chest', key: 'S', price: SHOP.chests.S };

  // materials
  for (const k of Object.keys(SHOP.materials)) {
    if (n === k || n === k.replace(/\s+/g, "")) return { type: 'material', key: k, price: SHOP.materials[k] };
  }

  // legendary
  for (const k of Object.keys(SHOP.legendary)) {
    if (n === k || n === k.replace(/\s+/g, "")) return { type: 'legendary', key: k, price: SHOP.legendary[k] };
  }

  // others
  for (const k of Object.keys(SHOP.others)) {
    if (n === k || n === k.replace(/\s+/g, "")) return { type: 'other', key: k, price: SHOP.others[k] };
  }

  return null;
}

export async function execute(interactionOrMessage) {
  const isInteraction = typeof interactionOrMessage.isCommand === "function" || typeof interactionOrMessage.isChatInputCommand === "function";
  const user = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
  const channel = isInteraction ? interactionOrMessage.channel : interactionOrMessage.channel;
  const userId = user.id;

  let itemName, amount;
  if (isInteraction) {
    itemName = interactionOrMessage.options.getString('item');
    amount = interactionOrMessage.options.getInteger('amount') || 1;
  } else {
    const parts = interactionOrMessage.content.trim().split(/\s+/);
    // remove prefix and command
    parts.splice(0, 2);
    // expect: op buy "item name" amount OR op buy itemname amount
    if (parts.length === 0) return channel.send('Usage: op buy "item name" <amount>');
    // if first token starts with a quote, join until closing quote
    if (parts[0].startsWith('"')) {
      let joined = parts.join(' ');
      const m = joined.match(/^"([^"]+)"\s*(\d+)?/);
      if (m) {
        itemName = m[1];
        amount = m[2] ? parseInt(m[2], 10) : 1;
      } else {
        // fallback: use first token
        itemName = parts[0]; amount = 1;
      }
    } else {
      itemName = parts[0]; amount = parts[1] ? parseInt(parts[1], 10) : 1;
    }
  }

  if (!itemName) {
    const reply = 'Specify an item to buy.';
    if (isInteraction) return interactionOrMessage.reply({ content: reply, ephemeral: true });
    return channel.send(reply);
  }

  amount = Math.max(1, parseInt(amount || 1, 10));

  const found = findItem(itemName);
  if (!found) {
    const reply = `Item "${itemName}" not found in the shop.`;
    if (isInteraction) return interactionOrMessage.reply({ content: reply, ephemeral: true });
    return channel.send(reply);
  }

  const total = (found.price || 0) * amount;

  const bal = await Balance.findOne({ userId }) || new Balance({ userId, amount: 0 });
  if ((bal.amount || 0) < total) {
    const reply = `Insufficient funds. Need ${total}¥ but you have ${(bal.amount||0)}¥.`;
    if (isInteraction) return interactionOrMessage.reply({ content: reply, ephemeral: true });
    return channel.send(reply);
  }

  // Deduct cost
  bal.amount = (bal.amount || 0) - total;
  await bal.save();

  // Add item to inventory
  const inv = await Inventory.findOne({ userId }) || new Inventory({ userId });
  if (found.type === 'chest') {
    const k = found.key;
    inv.chests = inv.chests || { C:0, B:0, A:0, S:0 };
    inv.chests[k] = (inv.chests[k] || 0) + amount;
  } else if (found.type === 'material' || found.type === 'legendary' || found.type === 'other') {
    const key = String(found.key).toLowerCase();
    // map certain names into inventory fields
    if (key === 'xp book') inv.xpBooks = (inv.xpBooks || 0) + amount;
    else if (key === 'xp scroll') inv.xpScrolls = (inv.xpScrolls || 0) + amount;
    else if (key === 'reset token') {
      const bal2 = await Balance.findOne({ userId }) || new Balance({ userId });
      bal2.resetTokens = (bal2.resetTokens || 0) + amount;
      await bal2.save();
    } else {
      const items = inv.items instanceof Map ? inv.items : new Map(Object.entries(inv.items || {}));
      const prev = Number(items.get(key) || 0);
      items.set(key, prev + amount);
      inv.items = items;
    }
  }

  await inv.save();

  const reply = `Purchased ${amount} x ${found.key} for ${total}¥.`;
  if (isInteraction) return interactionOrMessage.reply({ content: reply });
  return channel.send(reply);
}

export const category = "Shop";
export const description = "Buy an item from the shop";
