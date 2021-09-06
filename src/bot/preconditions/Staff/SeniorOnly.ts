import { Precondition, PreconditionResult } from "@sapphire/framework";
import { Message } from "discord.js";

export class SeniorOnlyPrecondition extends Precondition {
	public run(message: Message): PreconditionResult {
		if (!message.member) return this.ok();

		return this.container.client.permissionHandler.hasSenior(message.member)
			? this.ok()
			: this.error({
					message: "Only **Senior Team+** are allowed to use this command",
			  });
	}
}
