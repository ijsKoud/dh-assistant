import { Message } from "discord.js";
import { Command } from "discord-akairo";

export default class banCommand extends Command {
	constructor() {
		super("ban", {
			aliases: ["ban", "b"],
			channel: "guild",
			clientPermissions: ["BAN_MEMBERS"],
			userPermissions: ["BAN_MEMBERS"],
			cooldown: 1e3,
			description: {
				content: "Ban someone, this can be a user in or outside the server.",
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
					default: "no reason given",
					match: "rest",
				},
			],
		});
	}

	async exec(message: Message, { id, reason }: { id: string; reason: string }) {
		const user = await this.client.utils.fetchUser(id);
		if (!user || !id) return message.util.send(this.client.messages.noUser.replace("{USER}", id));

		const member = await this.client.utils.fetchMember(user.id, message.guild);
		if (member) {
			const check = this.client.utils.checkPerms(member, message.member);
			if (check) return message.util.send(check.replace("{TYPE}", "ban"));
		}

		try {
			const msg = await user
				.send(
					this.client.tagscript(this.client.messages.DM, {
						TYPE: "Ban",
						GUILD: message.guild.name,
						reason: reason.substr(0, 1900),
					})
				)
				.catch((e) => null);
			await message.guild.members.ban(user, { reason: `${message.author.id}|${reason}` });

			message.util.send(
				`Successfully banned **${user.tag}** for **${reason.substr(0, 1500)}**.${
					!msg ? "\nℹ | I was unable to DM this user." : ""
				}`
			);
		} catch (e) {
			this.client.log("ERROR", `Ban command error (${message.guild.id}): \`\`\`${e}\`\`\``);
			message.util
				.send(this.client.messages.error.replace("{CMD}", "Ban").replace("{e}", e))
				.catch((e) => null);
		}
	}
}
