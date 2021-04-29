import { Message } from "discord.js";
import { Command } from "discord-akairo";
import warn from "../../models/logging/Warn";

export default class reasonCommand extends Command {
	constructor() {
		super("reason", {
			aliases: ["reason"],
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["USE_EXTERNAL_EMOJIS"],
			description: {
				content: "Updates the reason of a warn",
				usage: "reason <caseId> <reason>",
			},
			cooldown: 1e3,
			args: [
				{
					id: "caseId",
					type: (_: Message, str: string) => (str ? (str.startsWith("#") ? str : `#${str}`) : null),
				},
				{
					id: "reason",
					type: "string",
					match: "rest",
				},
			],
		});
	}

	async exec(message: Message, { caseId, reason }: { caseId: string; reason: string }) {
		if (!caseId || !reason)
			return message.util.send(this.client.responses.missingArg("No caseId or reason provided."));

		const data = await warn.findOne({
			caseId,
			guildId: message.guild.id,
		});
		if (!data)
			return message.util.send(
				this.client.responses.missingArg(`I didn't find a case with the id "${caseId}".`)
			);

		data.reason = reason;
		await data.save();

		return message.util.send(
			`>>> ${this.client.emoji.greentick} | Successfully updated the reason for warning **${caseId}**!`
		);
	}
}
