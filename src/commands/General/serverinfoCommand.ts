import { Message, MessageEmbed } from "discord.js";
import { Command } from "discord-akairo";

export default class serverinfoCommand extends Command {
	constructor() {
		super("serverinfo", {
			aliases: ["serverinfo", "sinfo"],
			description: {
				content: "Gathers all info for the provided user",
				usage: "serverinfo [user]",
			},
		});
	}

	async exec(message: Message) {
		message.util.send(
			new MessageEmbed()
				.setColor(this.client.hex)
				.setThumbnail(message.guild.iconURL({ dynamic: true, size: 4096 }))
				.addFields([
					{
						name: "• Owner",
						value: `${message.guild.owner.user.tag}\n${message.guild.owner.toString()}`,
						inline: true,
					},
					{
						name: "• Members",
						value: `**Total**: ${message.guild.memberCount}\n**Users**: ${
							message.guild.members.cache.filter((g) => !g.user.bot).size
						}\n**Bots**: ${message.guild.members.cache.filter((g) => g.user.bot).size}`,
						inline: true,
					},
					{
						name: "• Channels",
						value: `**Voice**: ${
							message.guild.channels.cache.filter((c) => c.type === "voice").size
						}\n**Text**: ${
							message.guild.channels.cache.filter((c) => c.type === "text").size
						}\n**Category**: ${
							message.guild.channels.cache.filter((c) => c.type === "category").size
						}`,
						inline: true,
					},
					{
						name: "• Roles",
						value: `${this.client.utils
							.trimArray(message.guild.roles.cache.map((r) => r.toString()).slice(1))
							.join(", ")}`,
						inline: true,
					},
					{
						name: "• Boost status",
						value: `**Boosts**: ${message.guild.premiumSubscriptionCount}\n**Level**: ${message.guild.premiumTier}`,
						inline: true,
					},
				])
		);
	}
}
