import { Client, GatewayIntentBits, Collection } from "discord.js";
import { config } from "dotenv";
import { connectDB } from "./config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

config();
await connectDB();

// Build intents. MessageContent is required for prefix message commands.
// Make sure you've enabled it on the Discord Developer Portal for the bot.
const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
];

const client = new Client({ intents });

client.commands = new Collection();

// dynamically load commands
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const imported = await import(`./commands/${file}`);
  const command = imported.default || imported; // normalize default vs named exports
  // compute a safe command name (lowercased) from the SlashCommandBuilder
  let cmdName;
  try {
    cmdName = (command.data && command.data.name) || (command.data && command.data.toJSON && command.data.toJSON().name) || file.replace(/\.js$/, "");
  } catch (e) {
    cmdName = file.replace(/\.js$/, "");
  }
  client.commands.set(String(cmdName).toLowerCase(), command);
  // register aliases if provided by the command module (e.g. ['inv','inventory'])
  if (command.aliases && Array.isArray(command.aliases)) {
    for (const a of command.aliases) {
      client.commands.set(String(a).toLowerCase(), command);
    }
  }
}
// simple message-based prefix handling: prefix is "op" (case-insensitive)
client.on("messageCreate", async (message) => {
  try {
    if (!message.content) return;
    if (message.author?.bot) return;

    const parts = message.content.trim().split(/\s+/);
    if (parts.length < 2) return;

    // prefix is the first token; must be 'op' case-insensitive
    if (parts[0].toLowerCase() !== "op") return;

    const commandName = parts[1].toLowerCase();
    const command = client.commands.get(commandName);
    if (!command) return;

    // call the same execute exported for slash commands; pass message and client
    await command.execute(message, client);
  } catch (err) {
    console.error("Error handling message command:", err);
  }
});

// dynamically load events
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = await import(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Start a small HTTP server FIRST so Render and uptime monitors (e.g., UptimeRobot)
// can check that the service is alive even if Discord login hangs. This avoids
// adding express as a dependency and works with Render's $PORT environment variable.
import http from "http";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/health" || req.url === "/_health")) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("OK");
  }

  if (req.method === "GET" && req.url === "/status") {
    const payload = {
      status: "ok",
      port: PORT,
      discord: client.user ? `${client.user.tag}` : null,
      uptimeSeconds: Math.floor(process.uptime()),
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(payload));
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => console.log(`Health server listening on port ${PORT}`));

// Ensure we have a token and make login failures visible in Render logs
if (!process.env.TOKEN) {
  console.error("❌ TOKEN is not set in environment variables. Set TOKEN in your Render service settings.");
  // Keep the process alive so you can inspect the service; don't exit immediately
} else {
  console.log(`Found TOKEN of length ${process.env.TOKEN.length} characters — attempting Discord login...`);

  // Wrap login with a timeout so a hanging login doesn't prevent Render from marking
  // the service as running (it will still be restartable if we choose to exit on error).
  const loginWithTimeout = (token, ms = 30000) => {
    return Promise.race([
      client.login(token),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Discord login timed out")), ms)),
    ]);
  };

  (async () => {
    try {
      await loginWithTimeout(process.env.TOKEN, 30000);
      console.log("✅ Discord login initiated — waiting for ready event...");
    } catch (err) {
      console.error("❌ Discord login failed:", err);
      // Exit to ensure the deployment shows a failure if desired; comment out
      // to keep the process alive for debugging.
      process.exit(1);
    }
  })();
}
