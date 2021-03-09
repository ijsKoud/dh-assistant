import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Mute from "../../model/moderation/Mute";

export default class unmuteCommand extends Command {
	constructor() {
		super("unmute", {
			aliases: ["unmute"],
			channel: "guild",
			clientPermissions: ["MANAGE_ROLES"],
			userPermissions: ["MANAGE_MESSAGES"],
			cooldown: 1e3,
			description: {
				content: "unmute someone",
				usage: "unmute <user> [reason]",
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
		const member = await this.client.utils.fetchMember(id, message.guild);
		if (!member) return message.util.send(this.client.messages.noUser.replace("{USER}", id));

		try {
			if (!member.roles.cache.has(this.client.config.muteRole))
				return message.util.send("This user isn't muted in this server.");
			await member.roles.remove(this.client.config.muteRole, `${reason}`);

			const dbBan = await Mute.findOne({ guildId: message.guild.id, userId: member.id });
			if (dbBan) await dbBan.deleteOne();
			if (this.client.map.has(member.id + "-mute")) {
				clearTimeout(this.client.map.get(member.id + "-mute").timer);
				this.client.map.delete(member.id + "-mute");
			}
			this.client.emit("muteEvent", member, message.member, reason);
			message.util.send(
				`Successfully unmuted **${member.user.tag}** for **${reason.substr(0, 1500)}**.`
			);
		} catch (e) {
			this.client.log("ERROR", `Unmuted command error (${message.guild.id}): \`\`\`${e}\`\`\``);
			message.util
				.send(this.client.messages.error.replace("{CMD}", "Unmuted").replace("{e}", e))
				.catch((e) => null);
		}
	}
}
