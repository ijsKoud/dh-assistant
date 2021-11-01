import { Precondition, PreconditionResult } from "@sapphire/framework";
import { Message } from "discord.js";

export class PremiumOnlyPrecondition extends Precondition {
	public run(message: Message): PreconditionResult {
		if (!message.member) return this.ok();

		return this.container.client.permissionHandler.hasPremium(message.member, {
			staff: true,
			contentCreator: true
		})
			? this.ok()
			: this.error({
					message: `Only ${["Staff members", "Content Creators", "Boosters", "Channel members", "Level 5+"]
						.map((str) => `**${str}**`)
						.join(", ")} are allowed to use this command`
			  });
	}
}
