import { Precondition, PreconditionResult } from "@sapphire/framework";
import type { Message } from "discord.js";

export class CetOnlyPrecondition extends Precondition {
	public run(message: Message): PreconditionResult {
		if (!message.member) return this.ok();

		return this.container.client.permissionHandler.hasCet(message.member)
			? this.ok()
			: this.error({
					message: `Only ${["Cet", "Manager", "Senior Team"].map((str) => `**${str}**`).join(", ")} are allowed to use this command`
			  });
	}
}
