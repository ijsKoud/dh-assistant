import { Message } from "discord.js";
import { Command } from "discord-akairo";

export default class kickCommand extends Command {
	constructor() {
		super("kick", {
			aliases: ["kick", "k"],
			channel: "guild",
			clientPermissions: ["KICK_MEMBERS"],
			userPermissions: ["KICK_MEMBERS"],
			cooldown: 1e3,
			description: {
				content: "kick someone from the server.",
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
					default: "no reason given",
					match: "rest",
				},
			],
		});
	}

	async exec(message: Message, { id, reason }: { id: string; reason: string }) {
		const member = await this.client.utils.fetchMember(id, message.guild);
		if (!member || !id) return message.util.send(this.client.messages.noUser.replace("{USER}", id));
		const check = this.client.utils.checkPerms(member, message.member);
		if (check) return message.util.send(check.replace("{TYPE}", "kick"));

		try {
			const msg = await member
				.send(
					this.client.tagscript(this.client.messages.DM, {
						TYPE: "kick",
						GUILD: message.guild.name,
						reason: reason.substr(0, 1900),
					})
				)
				.catch((e) => null);
			member.kick(reason);
			this.client.emit("kickEvent", member, message.member, reason);

			message.util.send(
				`Successfully kicked **${member.user.tag}** for **${reason.substr(0, 1500)}**.${
					!msg ? "\nℹ | I was unable to DM this user." : ""
				}`
			);
		} catch (e) {
			this.client.log("ERROR", `Kick command error (${message.guild.id}): \`\`\`${e}\`\`\``);
			message.util
				.send(this.client.messages.error.replace("{CMD}", "Kick").replace("{e}", e))
				.catch((e) => null);
		}
	}
}
