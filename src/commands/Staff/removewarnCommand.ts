import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Warn from "../../models/logging/Warn";

export default class removewarnCommand extends Command {
	constructor() {
		super("removewarn", {
			aliases: ["removewarn", "rm"],
			userPermissions: ["MANAGE_MESSAGES"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Remove a warning using the case id",
				usage: "removewarn <caseId>",
			},
			args: [
				{
					id: "id",
					type: (_: Message, str: string) => (str ? (str.startsWith("#") ? str : `#${str}`) : null),
				},
			],
		});
	}

	async exec(message: Message, { id }: { id: string }) {
		const warn = await Warn.findOne({ caseId: id, guildId: message.guild.id });
		if (!warn)
			return message.util.send(
				this.client.responses.missingArg(`I couldn't find a warning with the id **${id}**.`)
			);

		const member = await this.client.utils.fetchMember(warn.userId, message.guild);
		if (member) {
			const check = this.client.utils.checkPerms(member, message.member);
			if (check) return message.util.send(check.replace("{type}", "remove a warning from"));
		}

		await warn.delete();
		await message.util.send(`>>> 🗑 | Successfully removed warning **${warn.caseId}**!`);
	}
}
