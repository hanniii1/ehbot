const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

// Helper function to parse and summarize the JSON data
function summarizeJSON(data) {
  const actions = data.actions || [];

  // We'll track each unit's stats using an object (like a dictionary)
  // Key = unit name, Value = { placed, totalSpent }
  const units = {};

  for (const action of actions) {
    const name = action.unitName;
    if (!name) continue;

    // Initialize the unit entry if we haven't seen it before
    if (!units[name]) {
      units[name] = { placed: 0, totalSpent: 0 };
    }

    // Count how many times the unit was placed
    if (action.type === "place") {
      units[name].placed += 1;
    }

    // Add up all money spent on this unit (placements + upgrades)
    if (action.money) {
      units[name].totalSpent += action.money;
    }
  }

  return units;
}

client.on("messageCreate", async (message) => {
  // Ignore bots
  if (message.author.bot) return;

  // Only process messages with attachments
  if (message.attachments.size === 0) return;

  // Filter for .json files only
  const jsonFiles = message.attachments.filter((att) =>
    att.name.endsWith(".json")
  );
  if (jsonFiles.size === 0) return;

  for (const [, attachment] of jsonFiles) {
    const directLink = attachment.url;
    const fileName = attachment.name;

    try {
      // Download the JSON file contents from Discord's CDN
      const res = await fetch(directLink);
      const data = await res.json();

      // Parse unit stats from the JSON
      const units = summarizeJSON(data);
      const unitNames = Object.keys(units);

      // Build the units summary text and tally the overall total
      let unitLines = "";
      let overallTotal = 0;
      for (const name of unitNames) {
        const { placed, totalSpent } = units[name];
        unitLines += `\n• **${name}** — Placed: ${placed}x | Total Spent: ¥${totalSpent.toLocaleString()}`;
        overallTotal += totalSpent;
      }

      // Build the Discord embed with a green side border
      const embed = {
        color: 0x00ff00, // Green
        title: data.name || fileName,
        fields: [
          {
            name: "Copy this link",
            value: `\`\`\`${directLink}\`\`\``,
          },
          {
            name: "Units Used",
            value: unitLines.trim(),
          },
          {
            name: "Total Spent Overall",
            value: `¥${overallTotal.toLocaleString()}`,
          },
        ],

      };

      await message.reply({ embeds: [embed] });

    } catch (err) {
      // If the file is not valid JSON or something goes wrong, let the user know
      console.error("Failed to parse JSON:", err);
      await message.reply({
        content: `Couldn't parse **${fileName}** as valid JSON. Here's the direct link anyway:\n${directLink}`,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
