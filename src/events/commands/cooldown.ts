import { Listener, Command } from "discord-akairo";
import { Message } from "discord.js";
import ms from "ms";

export default class cooldownListener extends Listener {
	constructor() {
		super("cooldown", {
			emitter: "commandHandler",
			event: "cooldown",
		});
	}

	exec(message: Message, command: Command, remaining: number) {
		message.util.send(`>>> ⌚ | Cooldown is active, please try again after \`${ms(remaining)}\`.`);
	}
}
