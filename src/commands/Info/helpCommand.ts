import { Command } from "discord-akairo";
import { MessageEmbed } from "discord.js";
import { Message } from "discord.js";

export default class helpCommand extends Command {
	public constructor() {
		super("help", {
			aliases: ["help", "commands", "cmd"],
			category: "Info",
			description: {
				content: "Shows you the list of available commands, or more info about a specific one.",
				usage: "help [command]",
			},
			args: [
				{
					id: "command",
					type: "command",
					default: "",
				},
			],
		});
	}

	public exec(message: Message, { command }: { command: Command }) {
		const embed = new MessageEmbed()
			.setColor(message.member?.displayHexColor || "#051B29")
			.setThumbnail(message.guild.iconURL({ dynamic: true, size: 4096 }))
			.setFooter(`❗ | The prefix for this bot is "${this.handler.prefix}".`)
			.setTitle(`Help Command - ${message.author.tag}`);

		if (command) {
			embed.setDescription([
				`>>> 🏷 | **Name**: ${command.id}`,
				`📁 | **Category**: ${command.category}`,
				`🔖 | **Aliases**: \`${command.aliases.join("`, `")}\`\n`,
				`📋 | **Usage**: ${command.description.usage || "No usage available"}`,
				`📘 | **Description**: ${command.description.content || "No usage available"}`,
			]);
		} else {
			for (const category of this.handler.categories.values()) {
				if (["ownerOnly"].includes(category.id) && !this.client.isOwner(message.author.id))
					continue;

				embed.addField(
					`• ${category.id}`,
					"`" +
						category
							.filter((c) => c.categoryID === category.id && c.aliases.length > 0)
							.map((c) => c.id)
							.join("`, `") +
						"`" || "No commands for this category",
					true
				);
			}
		}

		message.util.send(embed);
	}
}
