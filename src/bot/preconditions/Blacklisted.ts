import { Precondition, PreconditionResult } from "@sapphire/framework";
import { Message } from "discord.js";

export class BlacklistedPrecondition extends Precondition {
	public run(message: Message): PreconditionResult {
		return !this.container.client.blacklistManager.isBlacklisted(
			message.author.id,
			message.guild?.id
		)
			? this.ok()
			: this.error({
					message:
						"You or this server is blacklisted, you can no longer use this bot. If you think that this is a mistake, please DM one of the developers of this bot!",
			  });
	}
}
