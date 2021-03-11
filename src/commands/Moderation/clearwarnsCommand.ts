import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Warn from "../../model/moderation/Warn";

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
		if (!member || !id) return message.util.send(this.client.messages.noUser.replace("{USER}", id));

		const check = this.client.utils.checkPerms(member, message.member);
		if (check) return message.util.send(check.replace("{TYPE}", "clear warnings from"));

		try {
			const warns = await Warn.find({ guildId: message.guild.id });
			if (!warns?.length) return message.util.send(`No warning found for: **${member.user.tag}**.`);

			warns.forEach(async (w) => await w.deleteOne());
			message.util.send(`Successfully removed every warning from **${member.user.tag}**.`);
		} catch (e) {
			this.client.log("ERROR", `clearwarns error: \`\`\`${e}\`\`\``);
			message.util
				.send(this.client.messages.error.replace("{CMD}", "clearwarns").replace("{e}", e))
				.catch((e) => null);
		}
	}
}
