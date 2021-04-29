import { Message } from "discord.js";
import { Command } from "discord-akairo";

export default class whitelistCommand extends Command {
	constructor() {
		super("whitelist", {
			aliases: ["whitelist"],
			clientPermissions: ["USE_EXTERNAL_EMOJIS"],
			userPermissions: ["MANAGE_MESSAGES"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Ticket support whitelist someone",
				usage: "whitelist <user> [reason]",
			},
			args: [
				{
					id: "id",
					type: "string",
				},
				{
					id: "reason",
					type: "string",
					match: "rest",
					default: "No reason provided.",
				},
			],
		});
	}

	async exec(message: Message, { id, reason }: { id: string; reason: string }) {
		const user = await this.client.utils.fetchUser(id);
		if (!user) return message.util.send(this.client.responses.missingArg("Invalid user provided."));

		const blacklist = await this.client.ticketHandler.blacklisted(user.id, message.guild.id);
		if (!blacklist)
			return message.util.send(
				`>>> ${this.client.emoji.redcross} | **This user is not blacklisted**, I can not whitelist whitelisted users.`
			);

		await this.client.ticketHandler.whitelist(user.id, message.guild.id);

		await message.util.send(
			`>>> ${this.client.emoji.greentick} | Successfully whitelisted **${user.tag}** for **${reason}**.`
		);
	}
}
