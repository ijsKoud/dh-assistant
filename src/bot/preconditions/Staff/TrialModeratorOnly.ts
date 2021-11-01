import { Precondition, PreconditionResult } from "@sapphire/framework";
import { Message } from "discord.js";

export class TrialModeratorOnlyPrecondition extends Precondition {
	public run(message: Message): PreconditionResult {
		if (!message.member) return this.ok();

		return this.container.client.permissionHandler.hasTrial(message.member)
			? this.ok()
			: this.error({
					message: "Only **Trial Moderators+** are allowed to use this command"
			  });
	}
}
