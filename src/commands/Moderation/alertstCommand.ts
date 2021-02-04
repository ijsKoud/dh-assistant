import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class alertstCommand extends Command {
	constructor() {
		super("alerst", {
			aliases: ["alertst"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			description: {
				content: "Request support from the senior team",
				usage: "alertst [channel]",
			},
			cooldown: 1e3,
		});
	}

	async exec(message: Message, { channelId }: { channelId: Promise<string> }) {
		const available = message.guild.members.cache.filter((m) =>
			m.roles.cache.has("791638446207926324")
		);

		available.forEach((u) =>
			u
				.send(
					`Staff member ${message.author.toString()} has alerted all Senior Staff of a serious issue in channel ${message.channel.toString()}, please respond immediately!`
				)
				.catch((e) => null)
		);

		return message.react("👍");
	}
}
