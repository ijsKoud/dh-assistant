import {
	Message,
	Collection,
	MessageActionRow,
	MessageButton,
	ButtonInteraction,
	OverwriteResolvable,
} from "discord.js";
import { readFile } from "fs/promises";
import { join } from "path";
import Client from "../../Client";
import { emojis } from "../../constants";
import { GuildMessage } from "../Moderation";

export class TicketHandler {
	private ticketOpening = new Collection<string, boolean>();
	public settings!: TicketSettings;

	constructor(public client: Client) {
		this.loadSettings();
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

		if (
			await this.client.prisma.ticket.findFirst({
				where: { id },
			})
		)
			return;

		try {
			const dm = await message.author.createDM();
			const msg = await dm.send(
				">>> 👋 | Hello! What is the reason behind your ticket today? Please provide as much detail as possible so that we can help you as best as we can!"
			);

			const collected = await this.client.utils.awaitMessages(msg, {
				filter: (m) => m.author.id === message.author.id,
			});
			const firstMessage = collected.first();
			if (!firstMessage) return close();

			if (!firstMessage.content) {
				await dm.send(
					`>>> ${emojis.redcross} | No reason provided, we do not accept no reason for tickets.`
				);
				return close();
			}

			const claimChannel = await this.client.utils.getChannel(this.settings.channel);
			if (!claimChannel || !claimChannel.isText()) {
				this.client.loggers
					.get("bot")
					?.warn(
						"[TicketHandler]: Incorrect channel received for tickets, channel must be a text channel in this guild."
					);
				await dm.send(
					`>>> ${emojis.redcross} | Sorry, something went wrong. Please try again later!`
				);

				return close();
			}

			const createdMsg = await dm.send(`>>> ${emojis.loading} | Creating a ticket, please wait...`);
			const ticket = await this.client.prisma.ticket.create({
				data: { closed: false, id },
			});

			const embed = this.client.utils
				.embed()
				.setTitle(`New Ticket - ${ticket.caseId}`)
				.setDescription(firstMessage.content)
				.setFooter(
					message.author.tag,
					message.author.displayAvatarURL({ dynamic: true, size: 512 })
				);
			const component = new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId(`${message.author.id}-${message.guild.id}-${ticket.caseId}`)
					.setStyle("SUCCESS")
					.setEmoji(emojis.greentick)
			);
			await claimChannel.send({ embeds: [embed], components: [component] });

			await createdMsg.edit(
				`>>> ${emojis.greentick} | Ticket registered with the id \`${ticket.caseId}\`. If you don't receive an answer within **24 hours**, please contact a **Moderator+**.`
			);
		} catch (e) {
			await message.reply(
				`>>> ${emojis.error} | Something went wrong while processing your request, this is most of the times because your DM's are closed. Please try again later!`
			);
		}

		close();
	}

	public async handleInteraction(interaction: ButtonInteraction): Promise<void> {
		if (!interaction.inCachedGuild()) {
			this.client.loggers
				.get("bot")
				?.error(
					`[TicketHandler#handleInteraction]: Received interaction from uncached guild (${interaction.guildId})`
				);
			return;
		}
		if (interaction.channelId !== this.settings.channel) return;

		const [userId, guildId, caseId] = interaction.customId.split(/-/g);
		const id = `${userId}-${guildId}`;

		const ticket = await this.client.prisma.ticket.findFirst({
			where: { caseId: Number(caseId), id },
		});
		if (!ticket || ticket.claimer || ticket.channel || ticket.closed) return;

		const deleteTicket = async () => {
			await this.client.prisma.ticket.delete({ where: { caseId: Number(caseId) } });
			await interaction.channel?.messages.delete(interaction.message.id).catch(() => void 0);

			return;
		};

		const user = await this.client.utils.fetchUser(userId);
		if (!user) return deleteTicket();

		await interaction.channel?.messages.delete(interaction.message.id).catch(() => void 0);
		ticket.claimer = interaction.user.id;

		const overwrites = [
			...new Set([interaction.user.id, this.client.user?.id ?? "", ...this.settings.allowedRoles]),
		];

		try {
			const channel = await interaction.guild.channels.create(`ticket-${caseId}`, {
				type: "GUILD_TEXT",
				permissionOverwrites: [
					...overwrites.map(
						(_id): OverwriteResolvable => ({
							id: _id,
							allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
						})
					),
					{
						id: interaction.guildId,
						deny: ["VIEW_CHANNEL"],
					},
				],
			});

			if (this.settings.category)
				await channel.setParent(this.settings.category, { lockPermissions: false });

			const embed = this.client.utils
				.embed()
				.setTitle(`Ticket - ${ticket.caseId}`)
				.setDescription(interaction.message.embeds[0].description ?? "Unknown reason")
				.setFooter(
					`claimed by ${interaction.user.tag}`,
					interaction.user.displayAvatarURL({ dynamic: true, size: 512 })
				);
			await channel.send({ embeds: [embed] });

			ticket.channel = channel.id;
			await this.client.prisma.ticket.update({ where: { caseId: Number(caseId) }, data: ticket });

			await user.send(
				`>>> 🎫 | Your ticket has been claimed by **${
					interaction.member.nickname ?? interaction.user.id
				}** (${interaction.user.toString()}).`
			);
		} catch (err) {
			this.client.loggers
				.get("bot")
				?.fatal(
					`[TicketHandler#handleInteraction]: unable to complete ticket claiming ${caseId}`,
					err
				);
		}
	}
}

// interfaces
interface TicketSettings {
	channel: string;
	category: string;
	transcripts: string;
	allowedRoles: string[];
}
