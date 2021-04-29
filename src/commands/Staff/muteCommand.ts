import { Message } from "discord.js";
import { Command } from "discord-akairo";
import ms from "ms";
import { iLogs } from "../../models/interfaces";
import Logs from "../../models/logging/Logs";

export default class muteCommand extends Command {
	constructor() {
		super("mute", {
			aliases: ["mute"],
			clientPermissions: ["MANAGE_MESSAGES"],
			userPermissions: ["MANAGE_MESSAGES"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Mutes the provided user",
				usage: "mute <user> [reason]",
			},
			args: [
				{
					id: "id",
					type: "string",
				},
				{
					id: "duration",
					type: (_: Message, str: string) => (str ? ms(str) : null),
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

	async exec(
		message: Message,
		{ id, duration, reason }: { id: string; duration: number; reason: string }
	) {
		const member = await this.client.utils.fetchMember(id, message.guild);
		if (!member)
			return message.util.send(
				this.client.responses.missingArg("Couldn't find that user on in this server")
			);

		if (!duration || isNaN(duration))
			return message.util.send(
				this.client.responses.missingArg("Invalid duration provided (ex: 1d/2m/3s)")
			);

		const check = this.client.utils.checkPerms(member, message.member);
		if (check) return message.util.send(check.replace("{type}", "tempban"));

		const m = await Logs.findOne({ guildId: message.guild.id, userId: member.id, type: "mute" });
		if (m)
			return message.util.send(
				this.client.responses.missingArg(`This user is already muted in the server.`)
			);

		const role = await this.client.utils.getRole(message.guild.automod.mutes.role, message.guild);
		if (!role)
			return message.util.send(
				this.client.responses.missingArg(
					`No mute role found, please add one using the command \`${message.prefix}automod mute role <role>\``
				)
			);

		const mute: iLogs = {
			type: "mute",
			guildId: message.guild.id,
			userId: member.id,
			startDate: Date.now(),
			endDate: Date.now() + duration,
			moderator: message.author.id,
			reason,
		};

		await this.client.automod.mute(message, member, mute, role.id);
	}
}
