import { Message } from "discord.js";
import { Command } from "discord-akairo";
import warn from "../../model/moderation/Warn";

export default class reason extends Command {
	constructor() {
		super("reason", {
			aliases: ["reason"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			description: {
				content: "Updates a reason of a warn",
				usage: "reason <case id> <reason>",
			},
			cooldown: 1e3,
			args: [
				{
					id: "caseId",
					type: (_: Message, str: string) => (str.startsWith("#") ? str : `#${str}`),
					default: "caseId",
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
		if (!caseId || !reason) return message.util.send("No caseId or reason provided.");

		const data = await warn.findOne({
			caseId,
			guildId: message.guild.id,
		});
		if (!data) return message.util.send(`I didn't find a case with the id "${caseId}".`);

		data.reason = reason;
		await data.save();

		return message.util.send(`Successfully updated the reason for case "${caseId}"!`);
	}
}
