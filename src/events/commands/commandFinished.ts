import { Listener, Command } from "discord-akairo";
import { Message } from "discord.js";

export default class commandFinishedListener extends Listener {
	constructor() {
		super("commandFinished", {
			emitter: "commandHandler",
			event: "commandFinished",
		});
	}

	async exec(message: Message, command: Command, args: { [x: string]: string }) {
		if (!args && command.id === "adrequest") await message.delete().catch((e) => null);
	}
}
