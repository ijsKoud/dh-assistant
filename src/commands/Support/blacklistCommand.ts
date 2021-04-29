import { Message } from "discord.js";
import { Command } from "discord-akairo";

export default class blacklistCommand extends Command {
	constructor() {
		super("blacklist", {
			aliases: ["blacklist"],
			clientPermissions: ["USE_EXTERNAL_EMOJIS"],
			userPermissions: ["MANAGE_MESSAGES"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Ticket support blacklist someone",
				usage: "blacklist <user> [reason]",
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
		if (blacklist)
			return message.util.send(
				`>>> ${this.client.emoji.redcross} | **This user is already blacklisted**, you can not add them to the blacklist again.`
			);

		await this.client.ticketHandler.blacklist(user.id, message.guild.id);

		let dmed = true;
		await user
			.send(
				`>>> 🔨 | **Support Blacklist Received**:\nYou have been blacklisted in **${message.guild.name}**.\nReason: ${reason}`,
				{ split: true }
			)
			.catch((e) => (dmed = false));

		await message.util.send(
			`>>> 🔨 | Successfully blacklisted **${user.tag}** for **${reason}**.${
				dmed ? "" : "\nℹ | **I was unable to DM this user**, their blacklist has been recorded."
			}`
		);
	}
}
