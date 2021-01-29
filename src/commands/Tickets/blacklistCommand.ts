import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Blacklist from "../../models/blacklist";

export default class blacklist extends Command {
	constructor() {
		super("blacklist", {
			aliases: ["blacklist"],
			category: "Tickets",
			userPermissions: ["KICK_MEMBERS"],
			description: {
				content: "Blacklist a user from using tickets.",
				usage: "blacklist <user> [reason]",
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

		await Blacklist.create({ userId: user.id, guildId: message.guild.id });
		await user
			.send(
				`>>> 🔨 | **Blacklist - ${message.guild.name}**\nYou have been blacklisted from using the tickets system, please DM a senior team member for an appeal.`
			)
			.catch((e) => null);

		return message.react(this.client.utils.emojiFinder("greentick"));
	}
}
