import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Ban from "../../model/moderation/Ban";
import ms from "ms";

export default class tempbanCommand extends Command {
	constructor() {
		super("tempban", {
			aliases: ["tempban", "tb"],
			channel: "guild",
			clientPermissions: ["BAN_MEMBERS"],
			userPermissions: ["BAN_MEMBERS"],
			cooldown: 1e3,
			description: {
				content: "Tempban someone, this can be a user in or outside the server.",
				usage: "tempban <user> [reason]",
			},
			args: [
				{
					id: "id",
					type: "string",
					default: "user",
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
		const user = await this.client.utils.fetchUser(id);
		if (!user) return message.util.send(this.client.messages.noUser.replace("{USER}", id));

		const member = await this.client.utils.fetchMember(user.id, message.guild);
		if (member) {
			const check = this.client.utils.checkPerms(member, message.member);
			if (check) return message.util.send(check.replace("{TYPE}", "ban"));
		}

		if (isNaN(duration) || duration < 6e4 * 2)
			return message.util.send(
				"Sorry, to avoid ratelimits you can only tempban someone for a minimum of 2 minutes."
			);

		try {
			const msg = await user
				.send(
					this.client.tagscript(
						this.client.messages.DM + "\n\n⌚ | **Duration of ban**: `{DURATION}`",
						{
							TYPE: "Tempban",
							GUILD: message.guild.name,
							reason: reason.substr(0, 1900),
							DURATION: ms(duration),
						}
					)
				)
				.catch((e) => null);
			await Ban.create({
				guildId: message.guild.id,
				userId: user.id,
				moderator: message.author.id,
				date: Date.now() + duration,
				duration: duration,
			});
			await message.guild.members.ban(user, { reason: `${message.author.id}|${reason}` });

			message.util.send(
				`Successfully tempbanned **${user.tag}** for **${reason.substr(
					0,
					1500
				)}**. Duration of ban: \`${ms(duration)}\`${
					!msg ? "\nℹ | I was unable to DM this user." : ""
				}`
			);
		} catch (e) {
			this.client.log("ERROR", `Tempban command error (${message.guild.id}): \`\`\`${e}\`\`\``);
			message.util
				.send(this.client.messages.error.replace("{CMD}", "Tempban").replace("{e}", e))
				.catch((e) => null);
		}
	}
}
