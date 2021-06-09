import { Inhibitor, Command } from "discord-akairo";
import { Message } from "discord.js";

export default class wrongChannel extends Inhibitor {
	constructor() {
		super("wrongChannel", {
			reason: "wrongChannel",
		});
	}

	async exec(message: Message, command: Command) {
		return message.guild && message.guild.id === process.env.GUILD
			? ["general", "levels", "support"].includes(command.categoryID.toLowerCase()) &&
					message.channel.id === "701791506226348124"
			: false;
	}
}
