import { Message } from "discord.js";
import { Command } from "discord-akairo";

export default class warnCommand extends Command {
	constructor() {
		super("warn", {
			aliases: ["warn"],
			userPermissions: ["MANAGE_MESSAGES"],
			channel: "guild",
			description: {
				content: "Warns the provided user",
				usage: "warn <user> [reason]",
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
					default: "no reason provided.",
				},
			],
		});
	}

	async exec(message: Message, { id, reason }: { id: string; reason: string }) {
		const member = await this.client.utils.fetchMember(id, message.guild);
		if (!member)
			return message.util.send(
				this.client.responses.missingArg("Couldn't find that user in this server.")
			);

		const check = this.client.utils.checkPerms(member, message.member);
		if (check) return message.util.send(check.replace("{type}", "warn"));

		const warn = {
			guildId: message.guild.id,
			userId: member.id,
			date: Date.now(),
			moderator: message.author.id,
			reason,
		};

		await this.client.automod.warn(message, member.user, warn, message.guild.automod);
	}
}
