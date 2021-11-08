import { Precondition, PreconditionResult } from "@sapphire/framework";
import type { Message } from "discord.js";

export default class extends Precondition {
	public run(message: Message): PreconditionResult {
		if (!message.member) return this.ok();

		return this.container.client.permissionHandler.hasQotd(message.member)
			? this.ok()
			: this.error({
					message: `Only ${["Qotd", "Manager", "Senior Team"].map((str) => `**${str}**`).join(", ")} users are allowed to use this command`
			  });
	}
}
