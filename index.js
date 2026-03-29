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

client.on("messageCreate", async (message) => {
  // Ignore bots
  if (message.author.bot) return;

  // Check if the message has attachments
  if (message.attachments.size === 0) return;

  // Filter only .json files
  const jsonFiles = message.attachments.filter((attachment) =>
    attachment.name.endsWith(".json")
  );

  if (jsonFiles.size === 0) return;

  // Reply with the direct link for each .json file
  for (const [, attachment] of jsonFiles) {
    const directLink = attachment.url;
    const fileName = attachment.name;

    await message.reply({
      content: [
        `📄 **JSON File Detected!**`,
        `**File:** \`${fileName}\``,
        `**Direct Link:**`,
        `\`\`\``,
        directLink,
        `\`\`\``,
        `> Copy the link above and paste this link to import this JSON!`,
      ].join("\n"),
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
