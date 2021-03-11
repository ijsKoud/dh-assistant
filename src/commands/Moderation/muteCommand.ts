import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Mute from "../../model/moderation/Mute";
import ms from "ms";

export default class muteCommand extends Command {
	constructor() {
		super("mute", {
			aliases: ["mute", "m"],
			channel: "guild",
			clientPermissions: ["MANAGE_ROLES"],
			userPermissions: ["MANAGE_MESSAGES"],
			cooldown: 1e3,
			description: {
				content: "Mute someone.",
				usage: "Mute <user> [reason]",
			},
			args: [
				{
					id: "id",
					type: "string",
				},
				{
					id: "duration",
					type: (_: Message, str: string) => (str ? ms(str) : null),
					default: 864e5,
				},
				{
					id: "reason",
					type: "string",
					default: "no reason given",
					match: "rest",
				},
			],
		});
	}

	async exec(
		message: Message,
		{ id, reason, duration }: { id: string; reason: string; duration: number }
	) {
		const member = await this.client.utils.fetchMember(id, message.guild);
		if (!member || !id) return message.util.send(this.client.messages.noUser.replace("{USER}", id));

		const check = this.client.utils.checkPerms(member, message.member);
		if (check) return message.util.send(check.replace("{TYPE}", "mute"));

		if (isNaN(duration) || duration < 6e4 * 2)
			return message.util.send(
				"Sorry, to avoid ratelimits you can only mute someone for a minimum of 2 minutes."
			);

		try {
			const msg = await member
				.send(
					this.client.tagscript(
						this.client.messages.DM + "\n\n⌚ | **Duration of mute**: `{DURATION}`",
						{
							TYPE: "Mute",
							GUILD: message.guild.name,
							reason: reason.substr(0, 1900),
							DURATION: ms(duration),
						}
					)
				)
				.catch((e) => null);
			await Mute.create({
				guildId: message.guild.id,
				userId: member.id,
				moderator: message.author.id,
				date: Date.now() + duration,
				duration: duration,
			});
			await member.roles.add(this.client.config.muteRole, `${reason}`);
			this.client.emit("muteEvent", member, message.member, reason, duration);
			message.util.send(
				`Successfully muted **${member.user.tag}** for **${reason.substr(
					0,
					1500
				)}**. Duration of mute: \`${ms(duration)}\`${
					!msg ? "\nℹ | I was unable to DM this user." : ""
				}`
			);
		} catch (e) {
			this.client.log("ERROR", `Mute command error (${message.guild.id}): \`\`\`${e}\`\`\``);
			message.util
				.send(this.client.messages.error.replace("{CMD}", "Mute").replace("{e}", e))
				.catch((e) => null);
		}
	}
}
