import { Message, Collection, MessageActionRow, MessageButton } from "discord.js";
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
}

// interfaces
interface TicketSettings {
	channel: string;
	transcripts: string;
	allowedRoles: string;
}
