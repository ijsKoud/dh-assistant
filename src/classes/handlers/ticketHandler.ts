import {
	Collection,
	Message,
	User,
	TextChannel,
	OverwriteResolvable,
	GuildCreateChannelOptions,
	MessageReaction,
	MessageEmbed,
	GuildMember,
	MessageAttachment,
} from "discord.js";
import modtechClient from "../../client/client";
import Ticket from "../../models/tickets/Ticket";
import TicketConfig from "../../models/tickets/TicketConfig";
import { iTicket, iTicketConfig } from "../../models/interfaces";
import { nanoid } from "nanoid";
import { join } from "path";
import Blacklist from "../../models/tickets/Blacklist";
import Transcript from "../transcript/Transcript";

export default class ticketHandler {
	public tickets = new Collection<string, iTicket>();
	public timeouts = new Collection<string, NodeJS.Timeout>();

	constructor(private client: modtechClient) {}

	public async handleDM(message: Message): Promise<void> {
		let ticket = this.tickets.find((t) => t.userId === message.author.id);
		if (!ticket) {
			ticket = await Ticket.findOne({ userId: message.author.id });
			if (!ticket) return;

			this.tickets.set(ticket.caseId, ticket);
			setTimeout(() => this.tickets.delete(ticket.caseId), 5e3);
		}

		if (ticket.status === "closed") return;
		const channel = await this.client.utils.getChannel(ticket.channelId);
		if (!channel) return this.close(ticket);

		const files = this.client.utils.getAttachments(message.attachments);
		if (!message.content && !files.length) return;

		try {
			await channel.send(
				this.response(message.content || "no message content", message.author) +
					`Messages from the ticket claimer sent to this channel will automatically be sent to the ticket creator. Use \`${process.env.PREFIX}\` at the beginning of your message to stop this.`,
				{
					files,
					allowedMentions: { users: [] },
				}
			);
		} catch (e) {
			return this.close(ticket);
		}

		await message.react("✅").catch((e) => null);
	}

	public async handleTicket(message: Message): Promise<void> {
		if (message.channel.type !== "text") return;

		const caseId = message.channel.name;
		let ticket = this.tickets.get(caseId);
		if (!ticket) {
			ticket = await this.getTicket(caseId);
			if (!ticket) return;

			this.tickets.set(ticket.caseId, ticket);
			setTimeout(() => this.tickets.delete(ticket.caseId), 5e3);
		}

		if (
			ticket.claimerId !== message.author.id ||
			ticket.status === "closed" ||
			ticket.channelId !== message.channel.id ||
			(message.content && message.content.startsWith(message.prefix))
		)
			return;
		const user = await this.client.utils.fetchUser(ticket.userId);
		if (!user) return this.close(ticket);

		const files = this.client.utils.getAttachments(message.attachments);
		if (!message.content?.length && !files.length) return;

		try {
			await user.send(
				this.response(message.content || "no message content", message.author) +
					`\nTo reply, please include \`[${ticket.caseId}]\` at the beginning of your message and send it here.`,
				{ files, allowedMentions: { users: [] } }
			);
		} catch (e) {
			return this.close(ticket);
		}

		await message.react("✅").catch((e) => null);
	}

	public async createTicket(
		channel: TextChannel,
		{
			user,
			guildId,
			query,
			type,
		}: { user: User; guildId: string; query: string; type: "dev" | "ticket" }
	): Promise<iTicket> {
		const msg: Message = await channel.send(
			new MessageEmbed()
				.setColor(this.client.hex)
				.setDescription(query)
				.setTitle(`New ticket - ${user.tag}`)
				.setFooter(`React with ✅ to claim this ticket.`)
		);

		await msg.react("✅").catch((e) => null);
		return Ticket.create({
			guildId,
			userId: user.id,
			status: "unclaimed",
			caseId: await this.getId(type),
			messageId: msg.id,
		});
	}

	public async handleReaction(reaction: MessageReaction, user: User) {
		const ticket = await Ticket.findOne({ messageId: reaction.message.id });
		if (!ticket) return;

		ticket.status = "open";
		await ticket.save();
		await reaction.message.delete().catch((e) => null);

		const u = await this.client.utils.fetchUser(ticket.userId);
		if (!u) return this.close(ticket);

		try {
			const guild = this.client.guilds.cache.get(ticket.guildId);
			const config = await this.getConfig(ticket.guildId);
			const category = await this.client.utils.getChannel(config.category ?? "");
			const role = await this.client.utils.getRole(config.roleId, guild);

			const obj: GuildCreateChannelOptions = {
				type: "text",
				topic: "Do **NOT** edit this channel!",
				permissionOverwrites: [
					{
						id: guild.id,
						deny: ["VIEW_CHANNEL"],
					},
					{
						id: this.client.user.id,
						allow: [
							"SEND_MESSAGES",
							"VIEW_CHANNEL",
							"ATTACH_FILES",
							"ADD_REACTIONS",
							"MANAGE_MESSAGES",
						],
					},
					{
						id: user.id,
						allow: ["SEND_MESSAGES", "VIEW_CHANNEL", "ATTACH_FILES", "ADD_REACTIONS"],
					},
				],
			};
			if (category) obj.parent = category.id;
			if (role)
				(obj.permissionOverwrites as OverwriteResolvable[]).push({
					id: role.id,
					allow: ["SEND_MESSAGES", "VIEW_CHANNEL", "ATTACH_FILES", "ADD_REACTIONS"],
				});

			const channel = (await guild.channels.create(ticket.caseId, obj)) as TextChannel;
			await u.send(
				`>>> 🎫 | Your ticket \`[${ticket.caseId}]\` from **${
					this.client.guilds.cache.get(ticket.guildId).name
				}**  has been claimed by **${user.tag}** (${user.toString()})`,
				{ allowedMentions: { users: [] } }
			);

			ticket.claimerId = user.id;
			ticket.channelId = channel.id;
			await ticket.save();

			await (
				await channel.send(
					new MessageEmbed(reaction.message.embeds[0]).setFooter(`Ticket claimed by ${user.tag}`)
				)
			).pin();
		} catch (e) {
			this.client.log(
				"ERROR",
				`ticketHandler#handleReaction() error: \`\`\`${e.stack || e.message}\`\`\``
			);
			return this.close(ticket);
		}
	}

	public async getTicket(caseId: string): Promise<iTicket> {
		return Ticket.findOne({ caseId });
	}

	public async getConfig(guildId: string): Promise<iTicketConfig> {
		return TicketConfig.findOne({ guildId });
	}

	public async updateConfig(data: iTicketConfig): Promise<void> {
		await TicketConfig.findOneAndUpdate({ guildId: data.guildId }, data);
	}

	public async getId(prefix: "dev" | "ticket") {
		let id = `${prefix}-${nanoid(8).replace("-", "").toLowerCase()}`;
		while (await this.getTicket(id)) {
			id = `${prefix}-${nanoid(8).replace("-", "").toLowerCase()}`;
		}

		return id;
	}

	public async getUser(id: string): Promise<iTicket[]> {
		return Ticket.find({ userId: id });
	}

	public async blacklisted(userId: string, guildId: string): Promise<boolean> {
		return (await Blacklist.findOne({ userId, guildId })) ? true : false;
	}

	public async blacklist(userId: string, guildId: string) {
		return Blacklist.create({ userId, guildId });
	}

	public async whitelist(userId: string, guildId: string) {
		return Blacklist.findOneAndRemove({ userId, guildId });
	}

	public async transfer(
		data: iTicket,
		oldMember: GuildMember,
		newMember: GuildMember
	): Promise<void> {
		const config = await this.getConfig(data.guildId);
		const channel = await this.client.utils.getChannel(data.channelId);
		const user = await this.client.utils.fetchUser(data.userId);

		if (!oldMember.roles.cache.has(config.roleId))
			await channel.updateOverwrite(oldMember, {
				VIEW_CHANNEL: false,
			});

		data.claimerId = newMember.id;
		await Ticket.findOneAndUpdate({ caseId: data.caseId }, data);

		await channel.updateOverwrite(newMember, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true,
			ATTACH_FILES: true,
		});

		try {
			await user.send(
				`>>> 📨 | Your ticket \`[${data.caseId}]\` has been transferred to **${
					newMember.user.tag
				}** (${newMember.toString()}).`,
				{ allowedMentions: { users: [] } }
			);
		} catch (e) {
			return this.close(data);
		}

		await channel.send(
			`>>> 👋 | Welcome ${newMember.toString()}, please check the pins for more information!`,
			{ allowedMentions: { users: [newMember.id] } }
		);
	}

	public async close(data: iTicket): Promise<void> {
		if (this.timeouts.has(data.caseId)) return;

		data.status = "closed";
		await Ticket.findOneAndUpdate({ caseId: data.caseId }, data);

		const channel = await this.client.utils.getChannel(data.channelId);
		if (channel) {
			const { transcripts } = await this.getConfig(data.guildId);
			const tc = await this.client.utils.getChannel(transcripts.channelId);

			if (
				transcripts.enabled &&
				tc &&
				tc
					.permissionsFor(this.client.user)
					.has(["SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS"], true)
			) {
				const msg: Message = await channel
					.send(
						`>>> ${this.client.emoji.loading} | Saving ticket transcript, this may take a few seconds`
					)
					.catch((e) => null);

				const res = await this.transcript(channel, data.caseId).catch((e) => {
					this.client.log("ERROR", `Transcript error: \`\`\`${e.stack || e.message}\`\`\``);
					return null;
				});

				if (res) {
					await tc.send(
						`>>> 📁 | **Transcript [${data.caseId}]**\nTicket Claimer: <@${data.claimerId}>\nTicket Owner: <@${data.userId}>\nDirect Transcript: https://draavo.daangamesdg.tk/${data.caseId}`,
						{
							files: [
								new MessageAttachment(join(process.cwd(), "transcripts", `${data.caseId}.html`)),
							],
							allowedMentions: { users: [] },
						}
					);
				}
				await msg.delete().catch((e) => null);
			}

			await channel.send(`>>> 🗑 | Deleting this ticket in **5 seconds**!`).catch((e) => null);
		}

		const timeout = setTimeout(async () => {
			await channel?.delete?.()?.catch?.((e) => null);
			await Ticket.findOneAndDelete({ caseId: data.caseId }).catch((e) => null);
		}, 5e3);
		this.timeouts.set(data.caseId, timeout);

		const user = await this.client.utils.fetchUser(data.userId);
		if (user) {
			const dm = await user
				.send(
					`>>> 🎫 | Your ticket \`[${data.caseId}]\` has been closed, thanks for getting in touch!`
				)
				.catch((e) => null);

			if (!dm) return;

			const filter = (reaction: MessageReaction, u: User) => {
				return ["⛔", "🔴", "🟠", "🟢"].includes(reaction.emoji.name) && u.id === user.id;
			};

			const sendFeedback = async (reaction: string, content: string) => {
				const channel = await this.client.utils.getChannel("780907238561677322");
				await channel.send(
					new MessageEmbed()
						.setDescription(content || "No extra comments")
						.setTitle(`Feedback - ${reaction}`)
						.setFooter(
							`Feedback from ${user.tag}`,
							user.displayAvatarURL({ dynamic: true, size: 4096 })
						)
				);
			};

			const msg: Message = await user
				.send(
					`>>> Before you go, we'd really appreciate your feedback. Please react below with how you feel about your support that you received today.\n${[
						"⛔ - I do not wish to give feedback",
						"🔴 - Poor",
						"🟠 - Okay",
						"🟢 - Great",
					].join("\n")}`
				)
				.catch(() => null);

			if (!msg) return;
			["⛔", "🔴", "🟠", "🟢"].forEach((r) => msg.react(r));

			const r = await this.client.utils.awaitReactions(msg, filter);
			const reaction = r.first();
			if (!reaction) return;

			if (reaction.emoji.name === "⛔") {
				await user.send(">>> That's okay, thank you for contacting us today!").catch((e) => null);
				return;
			}

			const msg2 = await user
				.send(
					">>> Thank you for your rating. If you have any more comments, please leave them below. Otherwise just say `N/A`!"
				)
				.catch(() => null);

			const reactions = {
				"🔴": "Poor",
				"🟠": "Okay",
				"🟢": "Great",
			};
			if (!msg) {
				await sendFeedback(reactions[reaction.emoji.name], "");
				return;
			}

			const filter2 = (m: Message) => m.content && m.author.id === user.id;
			const res = await this.client.utils.awaitMessages(msg2, filter2);
			const feedback = res.first();

			await sendFeedback(reactions[reaction.emoji.name], feedback?.content);
			await user.send("Thanks for your feedback!");
		}
	}

	private async transcript(channel: TextChannel, caseId: string) {
		return await new Transcript(this.client, { channel, id: caseId }).create(
			join(process.cwd(), "transcripts", `${caseId}.html`)
		);
	}

	private response(content: string, user: User): string {
		return `>>> 💬 | Reply from **${user.tag}** (${user.toString()})\`\`\`${content.substr(
			0,
			1500
		)}\`\`\``;
	}
}
