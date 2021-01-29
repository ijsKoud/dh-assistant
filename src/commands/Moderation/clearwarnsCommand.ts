import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Warn from "../../models/warn";

export default class removewarn extends Command {
	constructor() {
		super("clearwarns", {
			aliases: ["clearwarns", "clearwarnings"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			description: {
				content: "Remove all the warnings from a user.",
				usage: "clearwarns <user>",
			},
			cooldown: 1e3,
			args: [
				{
					id: "userId",
					type: "string",
					match: "phrase",
				},
			],
		});
	}

	async exec(message: Message, { userId }: { userId: string }) {
		const redtick = this.client.utils.emojiFinder("redtick");
		const user = await this.client.utils.fetchUser(userId || "");

		if (!user) return message.util.send(`>>> 🔎 | I didn't find a user called "${userId}".`);

		const data = await Warn.find({
			guildId: message.guild.id,
			id: user.id,
		});
		if (!data)
			return message.util.send(`>>> ${redtick} | I didn't find any cases for **${user.tag}**.`);

		if (
			data[0].get("id") === message.author.id &&
			!message.member.hasPermission("MANAGE_GUILD", {
				checkAdmin: true,
				checkOwner: true,
			})
		)
			return message.util.send(
				`>>> ${redtick} | You can not remove your own warning unless you have the \`Manage Server\` permission!`
			);

		let error: any;
		data.forEach(async (d) => await d.delete().catch((e) => (error = e)));

		if (error)
			return message.util.send(
				`>>> ${this.client.utils.emojiFinder(
					"warning"
				)} | Oops, mongodb threw an exception: \`${error}\`.`
			);

		return message.util.send(
			`>>> ${this.client.utils.emojiFinder(
				"greentick"
			)} | Successfully removed all the warnings of **${user.tag}**.`
		);
	}
}
