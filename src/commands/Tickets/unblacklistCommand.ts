import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Blacklist from "../../models/blacklist";

export default class unblacklist extends Command {
	constructor() {
		super("unblacklist", {
			aliases: ["unblacklist", "whitelist"],
			category: "Tickets",
			userPermissions: ["KICK_MEMBERS"],
			description: {
				content: "unblacklist a user from using tickets.",
				usage: "unblacklist <user> [reason]",
			},
			channel: "guild",
			args: [
				{
					id: "userId",
					type: "string",
					match: "phrase",
				},
			],
		});
	}

	async exec(message: Message, { userId }: { userId: string }) {
		const user = await this.client.utils.fetchUser(userId || "");
		if (!user || user.id === message.author.id)
			return message.react(this.client.utils.emojiFinder("redtick"));

		const data = await Blacklist.findOne({ userId: user.id, guildId: message.guild.id });
		if (!data) return message.react(this.client.utils.emojiFinder("redtick"));
		data.delete();

		return message.react(this.client.utils.emojiFinder("greentick"));
	}
}
