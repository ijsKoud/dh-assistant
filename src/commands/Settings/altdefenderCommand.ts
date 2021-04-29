import { Message } from "discord.js";
import { Command } from "discord-akairo";

export default class altdefenderCommand extends Command {
	constructor() {
		super("altdefender", {
			aliases: ["altdefender", "raidprotection"],
			userPermissions: ["MANAGE_GUILD"],
			clientPermissions: ["USE_EXTERNAL_EMOJIS"],
			cooldown: 1e3,
		});
	}

	async exec(message: Message) {
		this.client.altdefender = !this.client.altdefender;
		return message.util.send(
			`>>> ${this.client.emoji.greentick} | Successfully **${
				this.client.altdefender ? "enabled" : "disabled"
			}** the altdefender.`
		);
	}
}
