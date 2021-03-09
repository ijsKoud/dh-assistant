import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Warn from "../../model/moderation/Warn";
import { iWarn } from "../../model/interfaces";

export default class warnCommand extends Command {
	constructor() {
		super("warn", {
			aliases: ["warn"],
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			cooldown: 1e3,
			description: {
				content: "Warn a user",
				usage: "warn <user> [reason]",
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
					match: "rest",
					default: "No reason given",
				},
			],
		});
	}

	async exec(message: Message, { id, reason }: { id: string; reason: string }) {
		const member = await this.client.utils.fetchMember(id, message.guild);
		if (!member) return message.util.send(this.client.messages.noUser.replace("{USER}", id));

		const check = this.client.utils.checkPerms(member, message.member);
		if (check) return message.util.send(check.replace("{TYPE}", "warn"));

		try {
			const caseId = await this.client.automod.warn(member, message.member, reason);
			const msg: Message = await member
				.send(
					this.client.tagscript(
						this.client.messages.DM +
							"\n\n❗ | This warning is registered under the id `{CASE_ID}`",
						{
							TYPE: "warning",
							GUILD: message.guild.name,
							CASE_ID: caseId,
							reason: reason.substr(0, 1900),
						}
					)
				)
				.catch((e) => null);

			message.util.send(
				`Successfully warned **${member.user.tag}** for **${reason.substr(0, 1500)}**.${
					!msg ? "\nℹ | I was unable to DM this user." : ""
				}`
			);
		} catch (e) {
			this.client.log("ERROR", `Warn command error (${message.guild.id}): \`\`\`${e}\`\`\``);
			message.util
				.send(this.client.messages.error.replace("{CMD}", "Warn").replace("{e}", e))
				.catch((e) => null);
		}
	}
}
