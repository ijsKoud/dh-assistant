import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Logs from "../../models/logging/Logs";

export default class kickCommand extends Command {
	constructor() {
		super("kick", {
			aliases: ["kick", "k"],
			clientPermissions: ["KICK_MEMBERS"],
			userPermissions: ["KICK_MEMBERS"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Kicks the provided user",
				usage: "kick <user> [reason]",
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

		let dmed = true;
		const check = this.client.utils.checkPerms(member, message.member);
		if (check) return message.util.send(check.replace("{type}", "kick"));

		await member
			.send(this.client.responses.kick(message.guild.name, reason), { split: true })
			.catch((e) => (dmed = false));

		await Logs.create({
			type: "kick",
			guildId: message.guild.id,
			userId: member.id,
			startDate: Date.now(),
			moderator: message.author.id,
			reason,
		});

		await member.kick(reason);
		await message.util.send(
			`>>> 👞 | Successfully kicked **${member.user.tag}** for **${reason}**.${
				dmed ? "" : "\nℹ | **I was unable to DM this user**, their kick has been recorded."
			}`
		);
	}
}
