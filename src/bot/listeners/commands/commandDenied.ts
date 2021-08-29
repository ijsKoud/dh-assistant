import type { CommandDeniedPayload, ListenerOptions } from "@sapphire/framework";
import { Listener, UserError } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<ListenerOptions>({ once: false, event: "commandDenied" })
export class CommandDeniedListener extends Listener {
	public async run({ context, message: content }: UserError, { message }: CommandDeniedPayload) {
		if (Reflect.get(Object(context), "silent")) return;

		return message.reply({
			content,
			allowedMentions: { users: [message.author.id], roles: [] },
		});
	}
}
