import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Logs from "../../models/logging/Logs";

export default class unbanCommand extends Command {
	constructor() {
		super("unban", {
			aliases: ["unban", "unb"],
			clientPermissions: ["BAN_MEMBERS"],
			userPermissions: ["BAN_MEMBERS"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Unban the provided user",
				usage: "unban <user> [reason]",
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
		if (!ban)
			return message.util.send(
				this.client.responses.missingArg("This user isn't banned in this server.")
			);

		await Logs.create({
			type: "unban",
			guildId: message.guild.id,
			userId: user.id,
			startDate: Date.now(),
			moderator: message.author.id,
			reason,
		});

		await message.guild.members.unban(user, reason);
		await this.client.timeoutHandler.delete({
			type: "ban",
			guildId: message.guild.id,
			userId: user.id,
		});
		await message.util.send(`>>> 🔨 | Successfully unbanned **${user.tag}** for **${reason}**.`);
	}
}
