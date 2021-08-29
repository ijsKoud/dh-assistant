import { Precondition, PreconditionResult } from "@sapphire/framework";
import { Message } from "discord.js";

export class OwnerOnlyPrecondition extends Precondition {
	public run(message: Message): PreconditionResult {
		return this.container.client.owners.includes(message.author.id)
			? this.ok()
			: this.error({
					message: `Only bot developers of **${this.container.client.user?.tag}** are able to use this command.`,
			  });
	}
}
