import { Listener } from "discord-akairo";
import { Message } from "discord.js";
import Ticket from "../../models/tickets/Ticket";

export default class messageDeleteListener extends Listener {
	constructor() {
		super("messageDelete", {
			emitter: "client",
			event: "messageDelete",
		});
	}

	async exec(message: Message) {
		try {
			const ticket = await Ticket.findOne({ messageId: message.id });
			if (ticket && ticket.status !== "open") await ticket?.delete?.().catch?.((e) => null);

			if (message.partial) return;
			if (message.author.partial) message.author = await message.author.fetch();
			if (message.author.bot || message.system || message.webhookID) return;

			this.client.loggingHandler.messageDelete(message);
		} catch (e) {
			this.client.log("ERROR", `messageDeleteListener Error: \`\`\`${e.stack || e.message}\`\`\``);
		}
	}
}
