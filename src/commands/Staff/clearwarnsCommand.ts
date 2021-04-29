import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Warn from "../../models/logging/Warn";

export default class clearwarnsCommand extends Command {
	constructor() {
		super("clearwarns", {
			aliases: ["clearwarns"],
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			cooldown: 2e3,
			description: {
				content: "Clear the warnings of someone",
				usage: "clearwarns <user>",
			},
			args: [
				{
					id: "id",
					type: "string",
				},
			],
		});
	}

	async exec(message: Message, { id }: { id: string }) {
		const member = await this.client.utils.fetchMember(id, message.guild);
		if (member) {
			const check = this.client.utils.checkPerms(member, message.member);
			if (check) return message.util.send(check.replace("{TYPE}", "clear warnings from"));
		}

		const user = await this.client.utils.fetchUser(id);
		if (!user) return message.util.send(this.client.responses.missingArg("Invalid user provided"));

		const warns = await Warn.find({ guildId: message.guild.id, userId: member.id });
		if (!warns?.length)
			return message.util.send(
				this.client.responses.missingArg(`No warning found for: **${member.user.tag}**.`)
			);

		warns.forEach(async (w) => await w.delete());
		message.util.send(
			`>>> ${this.client.emoji.greentick} Successfully removed every warning from **${member.user.tag}**.`
		);
	}
}
