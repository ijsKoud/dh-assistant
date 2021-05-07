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
		if (command?.id === "adrequest") await message.delete().catch((e) => null);

		this.client.log(
			"ERROR",
			`${command?.id || "unkown"} command error (${message.guild.id}): \`\`\`${
				error.stack || error.message
			}\`\`\``
		);

		await message.util
			.send(this.client.responses.error(command?.id || "unkown", error.message))
			.catch((e) => null);
	}
}
