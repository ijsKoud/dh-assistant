import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class tickets extends Command {
	constructor() {
		super("tickets", {
			aliases: ["tickets"],
			userPermissions: ["MANAGE_GUILD"],
			category: "Admin",
			description: {
				content: "Secret Command Only Available for Admins",
				usage: "tickets",
			},
		});
	}

	async exec(message: Message) {
		this.client.tickets = !this.client.tickets;
		return message.util.send(
			`>>> ${this.client.tickets ? "🔓" : "🔒"} | Tickets are now **${
				this.client.tickets ? "enabled" : "disabled"
			}**.`
		);
	}
}
