import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Ban from "../../model/moderation/Ban";

export default class unbanCommand extends Command {
	constructor() {
		super("unban", {
			aliases: ["unban", "ub"],
			channel: "guild",
			clientPermissions: ["BAN_MEMBERS"],
			userPermissions: ["BAN_MEMBERS"],
			cooldown: 1e3,
			description: {
				content: "unban someone from the server",
				usage: "unban <user> [reason]",
			},
			args: [
				{
					id: "id",
					type: "string",
					default: "user",
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

	async exec(message: Message, { id, reason }: { id: string; reason: string }) {
		const user = await this.client.utils.fetchUser(id);
		if (!user) return message.util.send(this.client.messages.noUser.replace("{USER}", id));

		try {
			const ban = await message.guild.fetchBan(user);
			if (!ban) return message.util.send("This user isn't banned in this server.");
			await message.guild.members.unban(user, `${message.author.id}|${reason}`);

			const dbBan = await Ban.findOne({ guildId: message.guild.id, userId: user.id });
			if (dbBan) await dbBan.deleteOne();
			if (this.client.map.has(user.id + "-ban")) {
				clearTimeout(this.client.map.get(user.id + "-ban").timer);
				this.client.map.delete(user.id + "-ban");
			}

			message.util.send(`Successfully unbanned **${user.tag}** for **${reason.substr(0, 1500)}**.`);
		} catch (e) {
			this.client.log("ERROR", `Unban command error (${message.guild.id}): \`\`\`${e}\`\`\``);
			message.util
				.send(this.client.messages.error.replace("{CMD}", "Unban").replace("{e}", e))
				.catch((e) => null);
		}
	}
}
