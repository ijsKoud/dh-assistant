import { Listener, Command } from "discord-akairo";
import { Message } from "discord.js";

export default class CommandBlockedListener extends Listener {
	constructor() {
		super("commandBlocked", {
			emitter: "commandHandler",
			event: "commandBlocked",
		});
	}

	exec(message: Message, command: Command, reason: string) {
		switch (reason) {
			case "guild":
				message.util.send(`You are unable to use the **${command.id}** command in DMs!`);
				break;
			case "owner":
				message.util.send(
					`Only Developers of ${this.client.user.toString()} have access to the **${
						command.id
					}** command.`
				);
				break;
			case "blacklisted":
				message.util.send(
					"You got 🔨 blacklisted... I wonder why? I mean it's pretty hard to get blacklisted believe me."
				);
				break;
			default:
				message.util.send(
					`You are unable to use the **${command.id}** command. Reason: \`${reason}\`!`
				);
				break;
		}
	}
}
