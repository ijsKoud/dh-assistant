import blacklist from "../../models/bot/botBlacklist";
import { Inhibitor, Command } from "discord-akairo";
import { Message } from "discord.js";

export default class botBlacklist extends Inhibitor {
	constructor() {
		super("botBlacklist", {
			reason: "blacklisted",
		});
	}

	async exec(message: Message, command: Command) {
		return (await blacklist.findOne({ userId: message.author.id })) ||
			(await blacklist.findOne({ guildId: message.guild?.id }))
			? true
			: false;
	}
}
