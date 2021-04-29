import { Message } from "discord.js";
import { Command } from "discord-akairo";

export default class closeCommand extends Command {
	constructor() {
		super("close", {
			aliases: ["close"],
			clientPermissions: ["USE_EXTERNAL_EMOJIS"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Closes a ticket and transcripts the channel if enabled",
				usage: "close",
			},
		});
	}

	async exec(message: Message) {
		if (
			message.channel.type !== "text" ||
			!["dev", "ticket"].includes(message.channel.name.split("-").shift())
		)
			return message.util.send(
				`>>> 🎫 | **This is not a ticket channel**, you can only run this command in tickets.`
			);

		const ticket = await this.client.ticketHandler.getTicket(message.channel.name);
		if (!ticket)
			return message.util.send(
				`>>> 🎫 | **This is not a ticket channel**, you can only run this command in tickets.`
			);

		if (
			ticket.claimerId !== message.author.id &&
			!message.member.hasPermission("MANAGE_CHANNELS", { checkAdmin: true, checkOwner: true })
		)
			return message.util.send(
				`>>> 🎫 | **You aren't allowed to do this**, you can only close your own ticket. Members with \`Manage Channels\` permission are able to bypass this.`
			);

		this.client.ticketHandler.close(ticket);
	}
}
