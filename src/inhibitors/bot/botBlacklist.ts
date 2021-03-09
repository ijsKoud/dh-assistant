import blacklist from "../../model/bot/botBlacklist";
import { Inhibitor, Command } from "discord-akairo";
import { Message } from "discord.js";

export default class botBlacklist extends Inhibitor {
	constructor() {
		super("botBlacklist", {
			reason: "blacklisted",
		});
	}

	async exec(message: Message, command: Command) {
		return (await blacklist.findOne({ userId: message.author.id })) ? true : false;
	}
}
