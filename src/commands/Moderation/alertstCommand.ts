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
			args: [
				{
					id: "channelId",
					type: async (m: Message, str: string) => (this.client.utils.getChannel(str) ? str : null),
					default: (m: Message) => m.channel.id,
				},
			],
		});
	}

	async exec(message: Message, { channelId }: { channelId: string }) {
		const channel = await this.client.utils.getChannel(channelId);
		const available = message.guild.members.cache.filter((m) =>
			m.roles.cache.has("791638446207926324")
		);

		available.forEach((u) =>
			u
				.send(
					`Staff member ${message.author.toString()} has alerted all Senior Staff of a serious issue in channel ${channel.toString()}, please respond immediately!`
				)
				.catch((e) => null)
		);

		return message.react("👍");
	}
}
