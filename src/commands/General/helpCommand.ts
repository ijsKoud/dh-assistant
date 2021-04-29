import { Command } from "discord-akairo";
import { MessageEmbed } from "discord.js";
import { Message } from "discord.js";
import ms from "ms";

export default class helpCommand extends Command {
	public constructor() {
		super("help", {
			aliases: ["help", "commands", "cmd"],
			clientPermissions: ["EMBED_LINKS"],
			description: {
				content: "Shows you the list of available commands, or more info about a specific one.",
				usage: "help [command]",
			},
			args: [
				{
					id: "command",
					type: "commandAlias",
				},
			],
		});
	}

	public async exec(message: Message, { command }: { command: Command }) {
		const embed = new MessageEmbed()
			.setColor(this.client.hex)
			.setFooter(
				`DH Assistant - created by DaanGamesDG`,
				this.client.user.displayAvatarURL({ dynamic: true, size: 4096 })
			)
			.setTitle(`Help Command - ${message.author.tag}`);

		if (command) {
			const userPermissions = this.client.utils.formatPerms(
				(command.userPermissions as string[]) || []
			);
			const clientPermissions = this.client.utils.formatPerms(
				(command.clientPermissions as string[]) || []
			);

			embed.setDescription([
				`>>> 🏷 | **Name**: ${command.id}`,
				`📁 | **Category**: ${command.category}`,
				`🔖 | **Aliases**: \`${command.aliases.join("`, `") || "-"}\`\n`,
				`📋 | **Usage**: ${command.description.usage || "-"}`,
				`📘 | **Description**: ${command.description.content || "-"}\n`,
				`👮‍♂️ | **User Permissions**: ${userPermissions || "-"}`,
				`🤖 | **Client Permissions**: ${clientPermissions || "-"}`,
				`⌚ | **Cooldown**: \`${ms(command.cooldown || 0, { long: false })}\``,
			]);
		} else {
			for (const category of this.handler.categories.values()) {
				if (
					["owneronly"].includes(category.id.toLowerCase()) &&
					!this.client.isOwner(message.author.id)
				)
					continue;

				embed.addField(
					`• ${category.id}`,
					"`" +
						(category
							.filter((c) =>
								c.categoryID === category.id &&
								c.aliases.length > 0 &&
								this.client.isOwner(message.author.id)
									? true
									: !c.ownerOnly
							)
							.map((c) => c.id)
							.join("`, `") || "No commands for this category") +
						"`",
					false
				);
			}
		}

		await message.util.send(embed);
	}
}
