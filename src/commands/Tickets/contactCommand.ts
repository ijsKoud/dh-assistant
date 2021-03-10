import { Command } from "discord-akairo";
import { Message, MessageEmbed } from "discord.js";
import Ticket from "../../model/tickets/Ticket";

export default class contactCommand extends Command {
	public constructor() {
		super("contact", {
			aliases: ["contact"],
			channel: "guild",
			description: {
				content: "Contact a user (contacting them instead of them contacting you)",
				usage: "contact <user> <reason>",
			},
			args: [
				{
					id: "userId",
					type: "string",
					prompt: {
						start: "Who do you want to contact?",
						retry: "Who do you want to contact?",
					},
				},
				{
					id: "reason",
					match: "rest",
					type: "string",
					prompt: {
						start: "What is the reason to open a ticket with this user?",
						retry: "What is the reason to open a ticket with this user?",
					},
				},
			],
		});
	}

	async exec(message: Message, { userId, reason }: { userId: string; reason: string }) {
		const config = await Ticket.findOne({ channelId: message.channel.id });
		const user = await this.client.utils.fetchUser(userId);

		if (!user) return message.util.send(`>>> 🔎 | I was unable to find a user called "${userId}"!`);
		if (config) return message.util.send(`>>> 🎫 | This user already has an open ticket!`);

		try {
			await user.send(
				`>>> 🎫 | **${message.author.toString()}** opened a ticket with you for **${reason.substr(
					0,
					1800
				)}**.`
			);
		} catch (e) {
			return message.util.send(
				">>> ❗ | I am unable to contact this user, please reach out to them directly!"
			);
		}

		const channel = await message.guild.channels.create("ticket", {
			type: "text",
			parent: this.client.config.tickets.category,
			permissionOverwrites: [
				{
					id: message.guild.id,
					deny: ["VIEW_CHANNEL"],
				},
				{
					id: this.client.user.id,
					allow: [
						"VIEW_CHANNEL",
						"ADD_REACTIONS",
						"EMBED_LINKS",
						"SEND_MESSAGES",
						"ATTACH_FILES",
						"MANAGE_MESSAGES",
					],
				},
				{
					id: user.id,
					allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
				},
			],
		});

		await Ticket.create({
			messageId: "messageId",
			channelId: channel.id,
			userId: user.id,
			claimerId: message.author.id,
			status: "open",
		});

		channel
			.send(
				new MessageEmbed()
					.setTitle(`Contacted - ${message.author.tag}`)
					.setDescription(reason.substr(0, 2048))
					.setFooter(`User: ${user.tag}`)
					.setColor(this.client.hex)
			)
			.then((m) => m.pin().catch((e) => null));
	}
}
