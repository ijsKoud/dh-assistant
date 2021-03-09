import { Listener } from "discord-akairo";
import { Message } from "discord.js";

export default class missingArg extends Listener {
	constructor() {
		super("missingArg", {
			emitter: "client",
			event: "missingArg",
		});
	}

	exec(message: Message, args: string[]) {
		message.util.send(`>>> ❗ | You forgot some arguments: \`${args.join("`, `")}\`!`);
	}
}
