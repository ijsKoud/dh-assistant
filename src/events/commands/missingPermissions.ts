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

	async exec(
		message: Message,
		command: Command,
		type: "client" | "user",
		missing: PermissionString[]
	) {
		if (command.id === "adrequest") await message.delete().catch((e) => null);
		const users = {
			client: this.client.user.tag,
			user: message.author.tag,
		};

		await message.util.send(
			`>>> 👮‍♂️ | Oops, **${users[type]}** is missing the following permissions for \`${
				command.id
			}\`: ${this.client.utils.formatPerms(missing)}.`
		);
	}
}
