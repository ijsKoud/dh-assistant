import type { Ticket } from ".prisma/client";
import {
	Message,
	Collection,
	MessageActionRow,
	MessageButton,
	ButtonInteraction,
	OverwriteResolvable,
	TextChannel,
	MessageOptions
} from "discord.js";
import { readFile } from "fs/promises";
import { join } from "path";
import type Client from "../../Client";
import type { GuildMessage } from "../Moderation";

export class TicketHandler {
	public settings!: TicketSettings;

	private ticketOpening = new Collection<string, boolean>();
	private tickets = new Collection<number, Ticket>();

	public constructor(public client: Client) {
		void this.loadSettings();
	}

	public async loadSettings(): Promise<void> {
		const data = await readFile(join(process.cwd(), "config", "ticket.json"), "utf-8");
		this.settings = JSON.parse(data);
	}

	public async handleMention(payload: Message): Promise<void> {
		if (!payload.guild) return;
		const message = payload as GuildMessage;
		const id = `${message.author.id}-${message.guildId}`;

		const close = () => {
			this.ticketOpening.delete(message.author.id);
		};

		this.ticketOpening.set(message.author.id, true);

		if (
			await this.client.prisma.ticket.findFirst({
				where: { id }
			})
		)
			return close();

		if (await this.client.prisma.ticketBlacklist.findFirst({ where: { id: message.author.id } })) {
			await message.author
				.send(
					`>>> ${this.client.constants.emojis.redcross} | I was unable to create a ticket for you, this is because you are currently on our ticket blacklist.`
				)
				.catch(() => void 0);

			return close();
		}

		try {
			const dm = await message.author.createDM();
			const msg = await dm.send(
				">>> 👋 | Hello! What is the reason behind your ticket today? Please provide as much detail as possible so that we can help you as best as we can!"
			);

			const collected = await this.client.utils.awaitMessages(msg, {
				filter: (m) => m.author.id === message.author.id
			});
			const firstMessage = collected.first();
			if (!firstMessage) return close();

			if (!firstMessage.content) {
				await dm.send(`>>> ${this.client.constants.emojis.redcross} | No reason provided, we do not accept no reason for tickets.`);
				return close();
			}

			const claimChannel = await this.client.utils.getChannel(this.settings.channel);
			if (!claimChannel || !claimChannel.isText()) {
				this.client.loggers
					.get("bot")
					?.warn("[TicketHandler]: Incorrect channel received for tickets, channel must be a text channel in this guild.");
				await dm.send(`>>> ${this.client.constants.emojis.redcross} | Sorry, something went wrong. Please try again later!`);

				return close();
			}

			const createdMsg = await dm.send(`>>> ${this.client.constants.emojis.loading} | Creating a ticket, please wait...`);
			const ticket = await this.client.prisma.ticket.create({
				data: { closed: false, id }
			});

			const embed = this.client.utils
				.embed()
				.setTitle(`New Ticket - ${ticket.caseId}`)
				.setDescription(firstMessage.content)
				.setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 512 }) });
			const component = new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId(`${message.author.id}-${message.guild.id}-${ticket.caseId}`)
					.setStyle("SUCCESS")
					.setEmoji(this.client.constants.emojis.greentick)
			);
			await claimChannel.send({ embeds: [embed], components: [component] });

			await createdMsg.edit(
				`>>> ${this.client.constants.emojis.greentick} | Ticket registered with the id \`${ticket.caseId}\`. If you don't receive an answer within **24 hours**, please contact a **Moderator+**.`
			);
		} catch (e) {
			await message.reply(
				`>>> ${this.client.constants.emojis.error} | Something went wrong while processing your request, this is most of the times because your DM's are closed. Please try again later!`
			);
		}

		close();
	}

	public async handleInteraction(interaction: ButtonInteraction): Promise<void> {
		if (!interaction.inCachedGuild()) {
			this.client.loggers
				.get("bot")
				?.error(`[TicketHandler#handleInteraction]: Received interaction from uncached guild (${interaction.guildId})`);
			return;
		}
		if (interaction.channelId !== this.settings.channel) return;

		const [userId, guildId, caseId] = interaction.customId.split(/-/g);
		const id = `${userId}-${guildId}`;

		const ticket = await this.client.prisma.ticket.findFirst({
			where: { caseId: Number(caseId), id }
		});
		if (!ticket || ticket.claimer || ticket.channel || ticket.closed) return;

		const deleteTicket = async () => {
			await this.client.prisma.ticket.delete({ where: { caseId: Number(caseId) } });
			await interaction.channel?.messages.delete(interaction.message.id).catch(() => void 0);
		};

		const user = await this.client.utils.fetchUser(userId);
		if (!user) return deleteTicket();

		await interaction.channel?.messages.delete(interaction.message.id).catch(() => void 0);
		ticket.claimer = interaction.user.id;

		const overwrites = [...new Set([interaction.user.id, this.client.user?.id ?? "", ...this.settings.allowedRoles])];

		try {
			const channel = await interaction.guild.channels.create(`ticket-${caseId}`, {
				type: "GUILD_TEXT",
				permissionOverwrites: [
					...overwrites.map(
						(_id): OverwriteResolvable => ({
							id: _id,
							allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"]
						})
					),
					{
						id: interaction.guildId,
						deny: ["VIEW_CHANNEL"]
					}
				]
			});

			if (this.settings.category) await channel.setParent(this.settings.category, { lockPermissions: false });

			const embed = this.client.utils
				.embed()
				.setTitle(`Ticket - ${ticket.caseId}`)
				.setDescription(interaction.message.embeds[0].description ?? "Unknown reason")
				.setFooter({ text: `claimed by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 512 }) });
			await channel.send({ embeds: [embed] }).then((m) => m.pin().catch(() => void 0));

			ticket.channel = channel.id;
			await this.client.prisma.ticket.update({ where: { caseId: Number(caseId) }, data: ticket });

			await user.send(
				`>>> 🎫 | Your ticket has been claimed by **${interaction.member.nickname ?? interaction.user.id}** (${interaction.user.toString()}).`
			);
		} catch (err) {
			this.client.loggers.get("bot")?.fatal(`[TicketHandler#handleInteraction]: unable to complete ticket claiming ${caseId}`, err);
		}
	}

	public async handleMessage(message: Message): Promise<void> {
		switch (message.channel.type) {
			case "DM":
				{
					try {
						const ticket = await this.getTicket("DM", message);
						if (!ticket || !ticket.channel || ticket.closed) return;

						const channel = await this.client.utils.getChannel(ticket.channel);
						if (!channel || !channel.isText()) return;

						if (!message.content && !message.attachments.size) return;
						await channel.send(this.getMessage(message, true));
						await message.react(this.client.constants.emojis.greentick).catch(() => void 0);
					} catch (err) {
						this.client.loggers.get("bot")?.error("Error while delivering a message from a ticket to the ticket channel", err);
						await message.reply(
							`>>> ${this.client.constants.emojis.error} | Unable to deliver the message to the correct channel, please try again or ask a moderator to close the ticket!`
						);
					}
				}
				break;
			case "GUILD_TEXT":
				{
					const TICKET_MESSAGE_PREFIX = `${process.env.PREFIX ?? "="}respond`;
					if (!message.content.startsWith(TICKET_MESSAGE_PREFIX)) return;
					message.content = message.content.replace(TICKET_MESSAGE_PREFIX, "");

					try {
						const ticket = await this.getTicket("TEXT", message);
						if (!ticket || ticket.closed) return;

						if (ticket.claimer !== message.author.id) return;

						const user = await this.client.utils.fetchUser(ticket.id.split("-")[0]);
						if (!user) return;

						if (!message.content && !message.attachments.size) return;
						await user.send(this.getMessage(message, false));
						await message.react(this.client.constants.emojis.greentick).catch(() => void 0);
					} catch (err) {
						this.client.loggers.get("bot")?.error("Error while delivering a message from a ticket channel to the user", err);
						await message.reply(
							`>>> ${this.client.constants.emojis.error} | Unable to DM the user, please try again or close the ticket!`
						);
					}
				}
				break;
			default:
				break;
		}
	}

	protected getMessage(message: Message, warning: boolean): MessageOptions {
		return {
			files: this.client.utils.getAttachments(message.attachments),
			content: `>>> 💬 | Reply from **${message.member?.nickname || message.author.tag}** (${message.author.toString()}): \`\`\`${
				message.content || "no message content"
			}\`\`\`${
				warning
					? `\nMessages from the ticket claimer sent to this channel will aren't automatically sent to the ticket creator. Use \`${this.client.options.defaultPrefix}respond <content>\` to reply.`
					: ""
			}`
		};
	}

	protected async getTicket(type: "DM" | "TEXT", message: Message): Promise<Ticket | null> {
		if (type === "DM") {
			let ticket: Ticket | null = this.tickets.find((t) => t.id.includes(message.author.id)) ?? null;
			if (!ticket) {
				ticket = await this.client.prisma.ticket.findFirst({
					where: { id: { contains: message.author.id } }
				});
				if (ticket) {
					const id = ticket.caseId;

					this.tickets.set(ticket.caseId, ticket);
					setTimeout(() => this.tickets.delete(id), 5e3);
				}
			}

			return ticket ?? null;
		}

		let id = Number((message.channel as TextChannel).name.split("-")[1]);
		if (isNaN(id)) return null;

		let ticket: Ticket | null = this.tickets.get(id) ?? null;
		if (!ticket) {
			ticket = await this.client.prisma.ticket.findFirst({
				where: { caseId: id }
			});
			if (ticket) {
				id = ticket.caseId;

				this.tickets.set(ticket.caseId, ticket);
				setTimeout(() => this.tickets.delete(id), 5e3);
			}
		}

		return ticket ?? null;
	}
}

// interfaces
interface TicketSettings {
	channel: string;
	category: string;
	transcripts: string;
	allowedRoles: string[];
}
