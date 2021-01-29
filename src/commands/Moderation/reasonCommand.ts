import { Message } from "discord.js";
import { Command } from "discord-akairo";
import warn from "../../models/warn";

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
					type: "string",
					match: "phrase",
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
			return this.client.emit("missingArg", message, ["<case id>", "<reason>"]);
		const redtick = this.client.utils.emojiFinder("redtick");
		caseId = `#${caseId.startsWith("#") ? caseId.slice(1) : caseId}`;

		const data = await warn.findOne({
			case: caseId,
			guildId: message.guild.id,
		});
		if (!data)
			return message.util.send(`>>> ${redtick} | I didn't find a case with the id "${caseId}".`);

		const newWarn = new warn({
			id: data.get("id"),
			guildId: message.guild.id,
			moderator: data.get("moderator"),
			reason,
			case: caseId,
			date: data.get("date") as number,
		});

		data.delete();
		newWarn.save();

		return message.util.send(
			`>>> ${this.client.utils.emojiFinder(
				"greentick"
			)} | Successfully updated the reason for case "${caseId}"!`
		);
	}
}
