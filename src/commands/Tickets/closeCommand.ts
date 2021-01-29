import { Message, TextChannel } from "discord.js";
import { Command } from "discord-akairo";
import ticket from "../../models/tickets";

export default class close extends Command {
	constructor() {
		super("close", {
			aliases: ["close"],
			category: "Tickets",
			description: {
				content: "Close a ticket if the channel is a ticket channel.",
				usage: "close",
			},
			channel: "guild",
		});
	}

	async exec(message: Message) {
		message.channel = message.channel as TextChannel;
		if (message.channel.name !== "ticket")
			return message.react(this.client.utils.emojiFinder("redtick"));

		let allowed: boolean = false;
		const schema = await ticket.findOne({ channelId: message.channel.id });
		if (!schema) return message.react(this.client.utils.emojiFinder("redtick"));

		if (schema.get("claimerId") == message.author.id) allowed = true;
		if (this.client.isOwner(message.author)) allowed = true;
		if (message.member.hasPermission("MANAGE_GUILD", { checkOwner: true, checkAdmin: true }))
			allowed = true;

		if (!allowed) return message.react(this.client.utils.emojiFinder("redtick"));
		message.util.send(">>> 🗑 | Deleting this ticket in **5** seconds...");
		setTimeout(() => message.channel.delete(`ticket deleted by ${message.author.tag}`), 5e3);
	}
}
