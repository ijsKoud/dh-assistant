import { Precondition, PreconditionResult } from "@sapphire/framework";
import { Message } from "discord.js";

export class ManagerOnlyPrecondition extends Precondition {
	public run(message: Message): PreconditionResult {
		if (!message.member) return this.ok();

		return this.container.client.permissionHandler.hasManager(message.member)
			? this.ok()
			: this.error({
					message: "Only **Managers+** are allowed to use this command"
			  });
	}
}
