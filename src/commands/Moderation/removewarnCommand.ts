import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Warn from "../../models/warn";

export default class removewarn extends Command {
	constructor() {
		super("removewarn", {
			aliases: ["removewarn", "removewarning"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			description: {
				content: "Remove a warning from a user.",
				usage: "removewarn <id>",
			},
			cooldown: 1e3,
			args: [
				{
					id: "caseId",
					type: "string",
					match: "phrase",
				},
			],
		});
	}

	async exec(message: Message, { caseId }: { caseId: string }) {
		if (!caseId) return this.client.emit("missingArg", message, ["<case id>"]);
		const redtick = this.client.utils.emojiFinder("redtick");
		caseId = `#${caseId.startsWith("#") ? caseId.slice(1) : caseId}`;

		const data = await Warn.findOne({
			case: caseId,
			guildId: message.guild.id,
		});
		if (!data)
			return message.util.send(`>>> ${redtick} | I didn't find a case with the id "${caseId}".`);
		if (
			data.get("id") === message.author.id &&
			!message.member.hasPermission("MANAGE_GUILD", {
				checkAdmin: true,
				checkOwner: true,
			})
		)
			return message.util.send(
				`>>> ${redtick} | You can not remove your own warning unless you have the \`Manage Server\` permission!`
			);

		data.delete().catch((e) => {
			return message.util.send(
				`>>> ${this.client.utils.emojiFinder(
					"warning"
				)} | Oops, mongodb threw an exception: \`${e}\`.`
			);
		});

		return message.util.send(
			`>>> ${this.client.utils.emojiFinder(
				"greentick"
			)} | Successfully removed warning "${caseId}".`
		);
	}
}
