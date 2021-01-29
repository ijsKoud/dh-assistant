import { Listener, Command } from "discord-akairo";
import { PermissionString } from "discord.js";
import { Message } from "discord.js";

export default class missingPermissionsListener extends Listener {
	constructor() {
		super("missingPermissions", {
			emitter: "commandHandler",
			event: "missingPermissions",
		});
	}

	exec(message: Message, command: Command, type: "client" | "user", missing: PermissionString[]) {
		message.util.send(
			`>>> 👮‍♂️ | Oops, **${type}** is missing the following permissions for \`${
				command.id
			}\`: \`${missing.join("`, `")}\`.`
		);
	}
}
