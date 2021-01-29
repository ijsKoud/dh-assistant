import { TextChannel, Message } from "discord.js";
import { Command } from "discord-akairo";
import ticket from "../../models/tickets";

export default class transfer extends Command {
	constructor() {
		super("transfer", {
			aliases: ["transfer"],
			category: "Tickets",
			description: {
				content: "Transfer a ticket to a different user.",
				usage: "transfer <user>",
			},
			channel: "guild",
			args: [
				{
					id: "userId",
					type: "string",
					match: "phrase",
				},
			],
		});
	}

	async exec(message: Message, { userId }: { userId: string }) {
		message.channel = message.channel as TextChannel;

		if (!userId) return this.client.emit("missingArg", message, ["<user>"]);
		if (message.channel.name !== "ticket")
			return message.react(this.client.utils.emojiFinder("redtick"));

		const user = await this.client.utils.fetchUser(userId);
		if (!user) return message.react(this.client.utils.emojiFinder("redtick"));

		let allowed: boolean = false;
		const schema = await ticket.findOne({ channelId: message.channel.id });
		if (!schema) return message.react(this.client.utils.emojiFinder("redtick"));

		if (schema.get("claimerId") == message.author.id) allowed = true;
		if (this.client.isOwner(message.author)) allowed = true;
		if (message.member.hasPermission("MANAGE_GUILD", { checkOwner: true, checkAdmin: true }))
			allowed = true;

		if (!allowed || user.presence.status === "offline" || user.bot || user.system)
			return message.react(this.client.utils.emojiFinder("redtick"));

		message.channel.updateOverwrite(message.author, {
			VIEW_CHANNEL: message.member.hasPermission("MANAGE_GUILD", {
				checkOwner: true,
				checkAdmin: true,
			})
				? true
				: false,
		});
		message.channel.updateOverwrite(user, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true,
			ATTACH_FILES: true,
		});

		const ticketOwner = await this.client.utils.fetchUser(schema.get("userId"));
		if (ticketOwner)
			ticketOwner
				.send(`>>> 📨 | Your ticket has been transferred to **${user.tag}**.`)
				.catch((e) => message.channel.delete("ticket closed by bot because user closed their DMs"));

		await ticket.findOneAndUpdate({ channelId: message.channel.id }, { claimerId: user.id });
		message.util.send(
			`>>> 👋 | Hello ${user.toString()}, check the pinned message for more information about this ticket!`,
			{ allowedMentions: { users: [user.id] } }
		);
	}
}
