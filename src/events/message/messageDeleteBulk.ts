import { Listener } from "discord-akairo";
import { Message, Collection } from "discord.js";

export default class messageDeleteBulkListener extends Listener {
	constructor() {
		super("messageDeleteBulk", {
			emitter: "client",
			event: "messageDeleteBulk",
		});
	}

	async exec(messages: Collection<string, Message>) {
		try {
			const { size } = messages;
			messages = messages
				.filter(
					(m) => !m.partial && m.content.length > 0 && !m.author.bot && !m.system && !m.webhookID
				)
				.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
			if (messages.size <= 0) return;

			this.client.loggingHandler.messageDeleteBulk(messages, size);
		} catch (e) {
			this.client.log("ERROR", `messageDeleteListener Error: \`\`\`${e.stack || e.message}\`\`\``);
		}
	}
}
