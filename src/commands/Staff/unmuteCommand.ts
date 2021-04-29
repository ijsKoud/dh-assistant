import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Logs from "../../models/logging/Logs";

export default class unmuteCommand extends Command {
	constructor() {
		super("unmute", {
			aliases: ["unmute"],
			clientPermissions: ["MANAGE_MESSAGES"],
			userPermissions: ["MANAGE_MESSAGES"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Unmutes the provided user",
				usage: "unmute <user> [reason]",
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
				this.client.responses.missingArg("Couldn't find that user on in this server")
			);

		const check = this.client.utils.checkPerms(member, message.member);
		if (check) return message.util.send(check.replace("{type}", "unmute"));

		const role = await this.client.utils.getRole(message.guild.automod.mutes.role, message.guild);
		if (!role)
			return message.util.send(
				this.client.responses.missingArg(
					`No mute role found, please add one using the command \`${message.prefix}automod mute role <role>\``
				)
			);

		const mute = await Logs.findOne({ guildId: message.guild.id, userId: member.id, type: "mute" });
		if (!mute)
			return message.util.send(
				this.client.responses.missingArg(`This user isn't muted in the server`)
			);

		await this.client.automod.unmute(
			message,
			member,
			{
				guildId: mute.guildId,
				userId: mute.userId,
				moderator: mute.moderator,
				reason,
				startDate: mute.startDate,
				endDate: mute.endDate,
				type: "mute",
			},
			role.id
		);
	}
}
