import { Message } from "discord.js";
import { Listener, Command } from "discord-akairo";

export default class errorEvent extends Listener {
	constructor() {
		super("error", {
			event: "error",
			emitter: "commandHandler",
		});
	}

	async exec(error: Error, message: Message, command?: Command) {
		this.client.log(
			"ERROR",
			`${command?.id || "unkown"} command error (${message.guild.id}): \`\`\`${error}\`\`\``
		);
		await message.util
			.send(
				this.client.messages.error
					.replace("{CMD}", command?.id || "unkown")
					.replace("{e}", error.stack || error.message)
			)
			.catch((e) => null);
	}
}
