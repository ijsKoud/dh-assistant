import { Message } from "discord.js";
import { Command } from "discord-akairo";

export default class transferCommand extends Command {
	constructor() {
		super("transfer", {
			aliases: ["transfer"],
			clientPermissions: ["USE_EXTERNAL_EMOJIS", "MANAGE_CHANNELS"],
			channel: "guild",
			cooldown: 3e3,
			description: {
				content: "Transfer a ticket to someone else",
				usage: "transfer <user>",
			},
			args: [
				{
					id: "id",
					type: "string",
				},
			],
		});
	}

	async exec(message: Message, { id }: { id: string }) {
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
				`>>> 🎫 | **You aren't allowed to do this**, you can only transfer your own ticket. Members with \`Manage Channels\` permission are able to bypass this.`
			);

		const member = await this.client.utils.fetchMember(id, message.guild);
		if (!member || member.user.bot)
			return message.util.send(this.client.responses.missingArg("Invalid user provided."));
		this.client.ticketHandler.transfer(ticket, message.member, member);
	}
}
