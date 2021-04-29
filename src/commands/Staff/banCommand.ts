import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Logs from "../../models/logging/Logs";

export default class banCommand extends Command {
	constructor() {
		super("ban", {
			aliases: ["ban", "b"],
			clientPermissions: ["BAN_MEMBERS"],
			userPermissions: ["BAN_MEMBERS"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Bans the provided user",
				usage: "ban <user> [reason]",
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
		const user = await this.client.utils.fetchUser(id);
		if (!user)
			return message.util.send(
				this.client.responses.missingArg("Couldn't find that user on discord at all")
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
			if (check) return message.util.send(check.replace("{type}", "ban"));

			await member
				.send(this.client.responses.ban(message.guild.name, reason), { split: true })
				.catch((e) => (dmed = false));
		} else dmed = false;

		await Logs.create({
			type: "ban",
			guildId: message.guild.id,
			userId: user.id,
			startDate: Date.now(),
			moderator: message.author.id,
			reason,
		});

		await message.guild.members.ban(user, { reason, days: 1 });
		await message.util.send(
			`>>> 🔨 | Successfully banned **${user.tag}** for **${reason}**.${
				dmed ? "" : "\nℹ | **I was unable to DM this user**, their ban has been recorded. "
			}`
		);
	}
}
