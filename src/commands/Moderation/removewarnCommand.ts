import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Warn from "../../model/moderation/Warn";

export default class removewarnCommand extends Command {
	constructor() {
		super("removewarn", {
			aliases: ["removewarn"],
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			cooldown: 1e3,
			description: {
				content: "Remove a warn",
				usage: "removewarn <id>",
			},
			args: [
				{
					id: "id",
					type: (_: Message, str: string) => (str.startsWith("#") ? str : `#${str}`),
				},
			],
		});
	}

	async exec(message: Message, { id }: { id: string }) {
		try {
			const warn = await Warn.findOne({ guildId: message.guild.id, caseId: id });
			if (!warn) return message.util.send(`No warning found with the id: **${id}**.`);

			const member = await this.client.utils.fetchMember(warn.userId, message.guild);
			if (member) {
				const check = this.client.utils.checkPerms(member, message.member);
				if (check) return message.util.send(check.replace("{TYPE}", "remove warnings from"));
			}

			await warn.deleteOne();
			message.util.send(`Successfully deleted warning: **${warn.caseId}**!`);
		} catch (e) {
			this.client.log("ERROR", `Removewarn error: \`\`\`${e}\`\`\``);
			message.util
				.send(this.client.messages.error.replace("{CMD}", "Removewarn").replace("{e}", e))
				.catch((e) => null);
		}
	}
}
