import { Listener, Command } from "discord-akairo";
import { Message } from "discord.js";

export default class CommandBlockedListener extends Listener {
	constructor() {
		super("commandBlocked", {
			emitter: "commandHandler",
			event: "commandBlocked",
		});
	}

	async exec(message: Message, command: Command, reason: string) {
		switch (reason) {
			case "guild":
				await message.util.send(
					`>>> ❗ | You are unable to use the **${command.id}** command in DMs!`
				);
				break;
			case "owner":
				await message.util.send(
					`>>> ❗ | Only Developers of ${this.client.user.toString()} have access to the **${
						command.id
					}** command.`
				);
				break;
			case "blacklisted":
				await message.util.send(
					">>> 🔨 | It looks like you are blacklisted, please DM **DaanGamesDG#7621** if you think this is a mistake."
				);
				break;
			case "wrongChannel":
				await message.util.send(">>> ❗ | You are not allowed to this command here.");
				break;
			default:
				await message.util.send(
					`>>> ❗ | You are unable to use the **${command.id}** command. Reason: \`${reason}\`!`
				);
				break;
		}
	}
}
