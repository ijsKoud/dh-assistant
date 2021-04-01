import { Message, Collection, MessageEmbed } from "discord.js";
import { Listener } from "discord-akairo";
import { iTicket } from "../../model/interfaces";
import Ticket from "../../model/tickets/Ticket";
import blacklist from "../../model/tickets/Blacklist";

const types = {
	spam: "spam",
	blacklisted: "use blacklisted words",
	mention: "mass mention users",
};
const filter = new Collection<string, iTicket>();

export default class messageEvent extends Listener {
	constructor() {
		super("message", {
			emitter: "client",
			event: "message",
		});
	}

	async exec(message: Message) {
		if (message.author.bot || message.system) return;

		if (
			!message.content.startsWith(this.client.commandHandler.prefix as string) &&
			!this.client.config.lvlBlacklisted.includes(message.channel.id) &&
			message.channel.type !== "dm"
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

		if (message.mentions.users.has(this.client.user.id) && message.content.startsWith("<@"))
			this.createTicket(message);
		if (
			message.channel.type === "dm" ||
			(message.channel.type === "text" && message.channel.name === "ticket")
		) {
			switch (message.channel.type) {
				case "dm":
					{
						if (message.content.trim().startsWith(this.client.commandHandler.prefix as string))
							return;

						let data: iTicket = filter.find((t) => t.userId === message.author.id);
						if (!data) {
							data = await Ticket.findOne({ userId: message.author.id });
							if (!data) return;

							filter.set(data.channelId, data);
							setTimeout(() => filter.delete(data.channelId), 5e3);
						}

						const channel = await this.client.utils.getChannel(data.channelId);
						if (!channel) {
							await Ticket.findOneAndDelete({ userId: message.author.id });
							filter.delete(data.channelId);
						}

						if (data.status === "closed") return;
						const files = this.client.utils.getAttachments(message.attachments);
						try {
							channel.send(
								`>>> 💬 | Reply from ${message.author.toString()}:\n\`\`\`\n${
									message.content.substr(0, 1800) || "No message content."
								}\n\`\`\`❓ | Add \`${
									this.client.commandHandler.prefix
								}\` to block the bot from sending a reply.`,
								{ files, allowedMentions: { users: [] } }
							);
						} catch (e) {
							return message.author
								.send(`>>> ⚠ | I am unable to send messages to this channel.`)
								.catch(async (e) => {
									await Ticket.findOneAndDelete({ userId: message.author.id });
									filter.delete(data.channelId);
									channel.delete("Unable to send messages to the user").catch((e) => null);
								});
						}
					}
					break;
				case "text":
					{
						if (message.content.trim().startsWith(this.client.commandHandler.prefix as string))
							return;

						let data: iTicket = filter.find((t) => t.channelId === message.channel.id);
						if (!data) {
							data = await Ticket.findOne({ channelId: message.channel.id });
							if (!data) return;

							filter.set(data.channelId, data);
							setTimeout(() => filter.delete(data.channelId), 5e3);
						}

						const user = await this.client.utils.fetchUser(data.userId);
						if (!user) {
							await Ticket.findOneAndDelete({ channelId: message.channel.id });
							filter.delete(data.channelId);
						}

						if (data.status === "closed" || data.claimerId !== message.author.id) return;
						const files = this.client.utils.getAttachments(message.attachments);
						try {
							user.send(
								`>>> 💬 | Reply from ${message.author.toString()}:\n\`\`\`\n${
									message.content.substr(0, 1800) || "No message content."
								}\n\`\`\`❓ | Add \`${
									this.client.commandHandler.prefix
								}\` to block the bot from sending a reply.`,
								{ files, allowedMentions: { users: [] } }
							);
						} catch (e) {
							return message.channel
								.send(`>>> ⚠ | I am unable to send messages to this user.`)
								.catch(async (e) => {
									await Ticket.findOneAndDelete({ userId: message.author.id });
									filter.delete(data.channelId);
									message.channel.delete("Unable to send messages to the user").catch((e) => null);
								});
						}
					}
					break;
				default:
					return;
			}

			message.react("✅");
		}

		if (
			!message.member ||
			message.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true }) ||
			this.client.isOwner(message.author.id) ||
			[
				"710223624442871970",
				"731221008085811253",
				"729327005341843486",
				"787361508567941130",
				"789521547751981106",
				"731221008085811253",
			].includes(message.channel.id)
		)
			return;

		const automod = this.client.automod.check(message);
		automod.forEach(async (w) => {
			if (w.type === "capabuse")
				return message.channel
					.send(`Hey ${message.author.toString()}, **${w.reason}**`)
					.then((m) => m.delete({ timeout: 5e3 }));

			if (w.type === "spam" && message.channel.id === "710090914776743966") return;
			if (
				w.type === "blacklisted" &&
				["826949661234692096", "723665469894164580"].includes(message.channel.id)
			)
				return;

			try {
				const caseId = await this.client.automod.warn(message.member, message.guild.me, w.reason);
				await message.member
					.send(
						this.client.tagscript(
							this.client.messages.DM +
								"\n\n❗ | This warning is registered under the id `{CASE_ID}`",
							{
								TYPE: "warning",
								GUILD: message.guild.name,
								CASE_ID: caseId,
								reason: w.reason.substr(0, 1900),
							}
						)
					)
					.catch((e) => null);

				message.channel
					.send(
						`Hey ${message.author.toString()}, you aren't allowed to **${types[w.type]}** here!`
					)
					.then((m) => m.delete({ timeout: 5e3 }))
					.catch((e) => null);
				message.delete().catch((e) => null);
			} catch (e) {
				this.client.log("ERROR", `Automod error: \`\`\`${e}\`\`\``);
			}
		});
	}

	async createTicket(message: Message) {
		let data: iTicket =
			filter.find((t) => t.userId === message.author.id) ||
			(await Ticket.findOne({ userId: message.author.id }));
		if (data) return;

		if (await blacklist.findOne({ userId: message.author.id }))
			return message.author
				.send(
					">>> 🔒 | You have been blacklisted, you can not use the ticket system until you are removed from the blacklist."
				)
				.catch((e) => null);
		if (!this.client.mod.tickets)
			return message.author
				.send(">>> 🔒 | Tickets have been disabled, please try again later.")
				.catch((e) => null);

		const dm = await message.author.createDM();
		let msg: Message;
		try {
			msg = await dm.send(
				">>> 👋 | Hello! What is the reason behind your ticket today? Please provide as much detail as possible so that we can help you as best as we can!"
			);
		} catch (e) {
			return message.channel.send(
				">>> ❗ | Sorry, it looks like your DMs are closed. Please open them, otherwise I am unable to open a ticket for you."
			);
		}

		const Filter = (m: Message) => {
			return message.author.id === m.author.id && message.content.length > 0;
		};
		const collector = await dm
			.awaitMessages(Filter, { max: 1, time: 6e5, errors: ["time"] })
			.catch((e) => new Collection<string, Message>());
		if (!collector || collector.size < 0) return msg.delete();

		const m = collector.first();
		const channel = await this.client.utils.getChannel(this.client.config.tickets.claim);
		if (!channel) return dm.send("No channel found, please contact the developer of this bot.");
		if (!m || m?.content.toLowerCase().startsWith("cancel")) return;

		const claimMsg = await channel
			.send(
				new MessageEmbed()
					.setTitle(`New ticket - ${message.author.tag}`)
					.setDescription((m.content || "no message content").substr(0, 2048))
					.setFooter("React with ✔ to claim this ticket.")
					.setColor(this.client.hex)
			)
			.catch((e) =>
				dm.send("I am unable to send messages or add embed links in the ticket claim channel.")
			);

		claimMsg
			.react("✔")
			.catch((e) =>
				this.client.log(
					"ERROR",
					"Unable to add `Message Reactions` to messages in the ticket claim channel."
				)
			);

		await Ticket.create({
			messageId: claimMsg.id,
			channelId: "channelId",
			userId: message.author.id,
			claimerId: "claimerId",
			status: "unclaimed",
		});

		dm.send(
			">>> 🎫 | Ticket has been created, a staff member will reach out to you shortly.\n❗ | Make sure your DMs stay **open**!"
		);
	}
}
