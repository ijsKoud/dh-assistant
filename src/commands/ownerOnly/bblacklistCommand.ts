import { Command } from "discord-akairo";
import { Message } from "discord.js";
import botBlacklist from "../../model/bot/botBlacklist";

export default class bblacklist extends Command {
	constructor() {
		super("bblacklist", {
			aliases: ["bblacklist"],
			args: [
				{
					id: "id",
					type: "string",
				},
			],
			ownerOnly: true,
		});
	}

	async exec(message: Message, { id }: { id: string }) {
		const user = await this.client.utils.fetchUser(id);
		if (!user) return message.util.send("No user found.");

		const blacklist = await botBlacklist.findOne({ userId: user.id });
		if (blacklist) return message.util.send("User is already blacklisted kek");

		await botBlacklist.create({ userId: user.id });
		message.util.send("Yay, another user blacklisted!");
	}
}
