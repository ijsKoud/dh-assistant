import { Listener } from "discord-akairo";
import { Collection } from "discord.js";
import { Message } from "discord.js";

export default class messageListener extends Listener {
	constructor() {
		super("message", {
			emitter: "client",
			event: "message",
		});
	}

	async exec(message: Message) {
		if (!message.content) return;
		if (message.author.bot || message.system || message.webhookID) return;

		if (message.channel.type === "dm") return this.client.ticketHandler.handleDM(message);

		if (
			!message.content.startsWith(message.prefix) &&
			!this.client.levelManager.lvlBlacklisted.includes(message.channel.id)
		) {
			const data =
				(await this.client.levelManager.getUser(message.author.id, message.guild.id)) ||
				(await this.client.levelManager.createUser(message.author.id, message.guild.id));
			const lvl = await this.client.levelManager.updateUser(message.author.id, message.guild.id, {
				xp: this.client.levelManager.generateXP(data.xp, message.member.multiplier),
			});

			if (lvl?.lvlUp) {
				await this.client.levelManager.rankUser(message.member, {
					...lvl.lvl,
					level: lvl.lvl.level + 1,
				});
				await message.channel.send(
					`Congratulations ${message.author.toString()}, you have got level **${
						lvl.lvl.level + 1
					}**!`
				);
			}
		}

		if (
			/<((@!?\d+)|(:.+?:\d+))>/g.test(message.content.trim().split(/ +/g).shift()) &&
			message.mentions.members.has(this.client.user.id) &&
			message.content.trim().split(/ +/g).length === 1 &&
			message.guild
		)
			return this.createTicket(message);

		if (message.channel.name.startsWith("ticket-") || message.channel.name.startsWith("dev-"))
			return this.client.ticketHandler.handleTicket(message);

		if (
			message.guild.automod &&
			!message.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true }) // */
		)
			this.client.automod.check(message, message.guild.automod);
	}

	async createTicket(message: Message) {
		const config = await this.client.ticketHandler.getConfig(message.guild.id);
		const dm = await message.author.createDM();
		let msg: Message;

		try {
			if (!config.enabled)
				return dm.send(
					`>>> ${this.client.emoji.redcross} | **Support tickets are closed in this server**, please try again later.`
				);

			if (await this.client.ticketHandler.blacklisted(message.author.id, config.guildId))
				return dm.send(">>> 🔨 | **Unable to open a ticket**\nReason: `Blacklisted`");

			const tickets = await this.client.ticketHandler.getUser(message.author.id);
			if (tickets.find((t) => t.caseId.includes("ticket") && t.guildId === message.guild.id))
				return dm.send(
					`>>> ${this.client.emoji.redcross} | **You already have a ticket open**, please close this ticket or raise the issue there.`
				);
		} catch (e) {
			return message.channel.send(
				">>> ❗ | Sorry, it looks like your DMs are closed. Please open them, otherwise I am unable to open a ticket for you."
			);
		}

		msg = await dm.send(
			">>> 👋 | Hello! What is the reason behind your ticket today? Please provide as much detail as possible so that we can help you as best as we can!"
		);

		const Filter = (m: Message) => {
			return message.author.id === m.author.id && message.content.length > 0;
		};
		const collector = await dm
			.awaitMessages(Filter, { max: 1, time: 6e5, errors: ["time"] })
			.catch((e) => new Collection<string, Message>());
		if (!collector || collector.size < 0 || !collector.first()?.content) return msg.delete();

		const query = collector.first()?.content;
		if (query.toLowerCase().startsWith("cancel")) return;

		const channel = await this.client.utils.getChannel(config.channelId);
		if (
			!channel ||
			channel.type !== "text" ||
			!channel
				.permissionsFor(this.client.user)
				.has(["SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS"])
		)
			return dm.send(
				">>> 🎫 | **Tickets - Channel**:\nNo valid channel found/missing required permissions (`Send Messages`, `Embed Links`, `Add Reaction`)"
			);

		try {
			const ticket = await this.client.ticketHandler.createTicket(channel, {
				user: message.author,
				guildId: message.guild.id,
				type: "ticket",
				query,
			});

			await dm.send(
				`>>> 🎫 | **Ticket created**:\nTicket id: \`${ticket.caseId}\`, Make sure to keep your DMs open!`
			);
		} catch (e) {
			await dm.send(
				`>>> ${this.client.emoji.redcross} | I was unable to create a ticket for you, please try again later.`
			);
		}
	}
}
