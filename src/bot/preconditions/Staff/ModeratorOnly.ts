import { Precondition, PreconditionResult } from "@sapphire/framework";
import { Message } from "discord.js";

export class ModeratorOnlyPrecondition extends Precondition {
	public run(message: Message): PreconditionResult {
		if (!message.member) return this.ok();

		return this.container.client.permissionHandler.hasMod(message.member)
			? this.ok()
			: this.error({
					message: "Only **Moderators+** are allowed to use this command"
			  });
	}
}
