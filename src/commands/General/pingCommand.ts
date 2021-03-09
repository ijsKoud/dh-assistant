import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class pingCommand extends Command {
	public constructor() {
		super("ping", {
			aliases: ["ping", "pong"],
			description: {
				content: "Check the edit and discord connection latency",
				usage: "ping",
			},
		});
	}

	async exec(message: Message) {
		const time = Date.now();
		const msg = await message.util.send(`> 🏓 Pinging...`);
		msg.edit(
			`> 🏓 Pong, edit latency is \`${Date.now() - time}\` ms and the API Latency is \`${
				this.client.ws.ping
			}\` ms!`
		);
	}
}
