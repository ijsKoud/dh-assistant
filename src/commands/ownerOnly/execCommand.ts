import { exec } from "child_process";
import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class execCommand extends Command {
	constructor() {
		super("exec", {
			aliases: ["exec"],
			category: "ownerOnly",
			args: [
				{
					id: "code",
					type: "string",
					match: "rest",
				},
			],
			ownerOnly: true,
		});
	}

	async exec(message: Message, { code }: { code: string }) {
		if (!code) this.client.emit("missingArg", message, ["code"]);
		return exec(code, (err, stdout) => {
			const response = stdout || err;
			return message.channel.send(response, { split: true, code: true });
		});
	}
}
