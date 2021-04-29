import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class openticketCommand extends Command {
	constructor() {
		super("openticket", {
			aliases: ["openticket", "createticket"],
			clientPermissions: ["USE_EXTERNAL_EMOJIS"],
			channel: "guild",
			cooldown: 2e3,
			description: {
				content: "Creates a ticket for the server staff if enabled",
				usage: "openticket <query>",
			},
			args: [
				{
					id: "query",
					type: "string",
					match: "rest",
				},
			],
		});
	}

	async exec(message: Message, { query }: { query: string }) {
		if (!query)
			return message.util.send(
				this.client.responses.missingArg("Please provide a query for the staff team.")
			);

		const config = await this.client.ticketHandler.getConfig(message.guild.id);
		if (!config.enabled)
			return message.util.send(
				`>>> ${this.client.emoji.redcross} | **Support tickets are closed in this server**, please try again later.`
			);
		if (await this.client.ticketHandler.blacklisted(message.author.id, config.guildId))
			return message.util.send(">>> 🔨 | **Unable to open a ticket**\nReason: `Blacklisted`");
		const tickets = await this.client.ticketHandler.getUser(message.author.id);
		if (tickets.find((t) => t.caseId.includes("ticket") && t.guildId === message.guild.id))
			return message.util.send(
				`>>> ${this.client.emoji.redcross} | **You already have a ticket open**, please close this ticket or raise the issue there.`
			);

		const channel = await this.client.utils.getChannel(config.channelId);
		if (
			!channel ||
			channel.type !== "text" ||
			!channel
				.permissionsFor(this.client.user)
				.has(["SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS"])
		)
			return message.util.send(
				">>> 🎫 | **Tickets - Channel**:\nNo valid channel found/missing required permissions (`Send Messages`, `Embed Links`, `Add Reaction`)"
			);

		try {
			const ticket = await this.client.ticketHandler.createTicket(channel, {
				user: message.author,
				guildId: message.guild.id,
				type: "ticket",
				query,
			});

			await message.util.send(
				`>>> 🎫 | **Ticket created**:\nTicket id: \`${ticket.caseId}\`, Make sure to keep your DMs open!`
			);
		} catch (e) {
			await message.util.send(
				`>>> ${this.client.emoji.redcross} | I was unable to create a ticket for you, please try again later.`
			);
		}
	}
}
