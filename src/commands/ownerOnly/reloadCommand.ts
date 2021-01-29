import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class reload extends Command {
	constructor() {
		super("reload", {
			aliases: ["reload"],
			category: "ownerOnly",
			args: [
				{
					id: "command",
					type: "commandAlias",
				},
			],
			ownerOnly: true,
		});
	}

	async exec(message: Message, { command }: { command: Command }) {
		if (!command)
			return message.util.send(
				`>>> ${this.client.utils.emojiFinder("terminalicon")} | No command found.`
			);
		command.reload();
		this.client.log(`🔄 | **${command.id}** command reloaded!`);
		return message.util.send(
			`>>> ${this.client.utils.emojiFinder("terminalicon")} | **${command.id}** command reloaded!`
		);
	}
}
