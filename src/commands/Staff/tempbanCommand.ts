import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Logs from "../../models/logging/Logs";
import ms from "ms";

export default class tempbanCommand extends Command {
	constructor() {
		super("tempban", {
			aliases: ["tempban"],
			clientPermissions: ["BAN_MEMBERS"],
			userPermissions: ["BAN_MEMBERS"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Tempbans the provided user",
				usage: "tempban <user> [reason]",
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
		const user = await this.client.utils.fetchUser(id);
		if (!user)
			return message.util.send(
				this.client.responses.missingArg("Couldn't find that user on discord at all")
			);

		if (!duration || isNaN(duration))
			return message.util.send(
				this.client.responses.missingArg("Invalid duration provided (ex: 1d/2m/3s)")
			);

		const ban = await message.guild.fetchBan(user).catch((e) => null);
		if (ban)
			return message.util.send(
				this.client.responses.missingArg("This user is already banned the server")
			);

		const member = await this.client.utils.fetchMember(user.id, message.guild);
		let dmed = true;
		if (member) {
			const check = this.client.utils.checkPerms(member, message.member);
			if (check) return message.util.send(check.replace("{type}", "tempban"));

			await member
				.send(this.client.responses.ban(message.guild.name, reason, ms(duration, { long: true })), {
					split: true,
				})
				.catch((e) => (dmed = false));
		} else dmed = false;

		const tempban = await Logs.create({
			type: "ban",
			guildId: message.guild.id,
			userId: user.id,
			startDate: Date.now(),
			endDate: Date.now() + duration,
			moderator: message.author.id,
			reason,
		});
		this.client.timeoutHandler.load(tempban);

		await message.guild.members.ban(user, { reason, days: 1 });
		await message.util.send(
			`>>> 🔨 | Successfully tempbanned **${user.tag}** for **${reason}**.${
				dmed ? "" : "\nℹ | **I was unable to DM this user**, their ban has been recorded. "
			}`
		);
	}
}
