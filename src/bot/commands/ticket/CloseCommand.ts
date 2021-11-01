import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import type { GuildMessage } from "../../../client/structures/Moderation";
import Transcript from "../../../client/structures/Transcript";
import { MessageAttachment, TextChannel } from "discord.js";
import { join } from "path";

@ApplyOptions<Command.Options>({
	name: "close",
	aliases: ["closeticket"],
	description: "Close a ticket",
	requiredClientPermissions: ["MANAGE_CHANNELS"],
	preconditions: ["ModeratorOnly", "GuildOnly"]
})
export default class CloseCommand extends Command {
	public async messageRun(message: GuildMessage): Promise<void> {
		if (!message.channel.isText()) return;
		if (!message.channel.name.startsWith("ticket-")) return;

		const { channel, author, member } = message;
		const ticket = await this.client.prisma.ticket.findFirst({
			where: { caseId: Number(channel.name.split("-")[1]) }
		});
		if (!ticket || ticket.closed || (author.id !== ticket.claimer && !this.client.permissionHandler.hasSenior(message.member))) return;

		ticket.closed = true;
		await this.client.prisma.ticket.update({ where: { caseId: ticket.caseId }, data: ticket });

		const user = await this.client.utils.fetchUser(ticket.id.split("-")[0]);
		const msg = await channel.send(`>>> ${this.client.constants.emojis.loading} | Closing the ticket...`);
		if (user)
			await user.send(
				`>>> 👋 | Your ticket (${ticket.caseId}) has been closed by **${member.nickname || author.username}** (${author.toString()})`
			);

		try {
			const transcript = new Transcript({ client: this.client, channel: channel as TextChannel });
			const path = join(process.cwd(), "transcripts", `ticket-${ticket.caseId}.html`);

			await transcript.create(path);

			const transcriptChannel = await this.client.utils.getChannel(this.client.ticketHandler.settings.transcripts);
			if (transcriptChannel && transcriptChannel.isText()) {
				const embed = this.client.utils
					.embed()
					.setTitle(`Transcript: ticket-${ticket.caseId}`)
					.setDescription(
						[`Claimed by <@${ticket.claimer}>`, `Closed by ${author.toString()}`, `Owner: <@${ticket.id.split("-")[0]}>`].join("\n")
					);

				await transcriptChannel.send({
					embeds: [embed],
					attachments: [new MessageAttachment(path, `ticket-${ticket.caseId}.html`)]
				});
			}
		} catch (err) {
			this.client.loggers.get("bot")?.fatal("Unable to create ticket transcript:", err);
			await channel.send(`>>> ${this.client.constants.emojis.error} | Unable to create a ticket transcript.`);
		}

		await msg.edit(`>>> ${this.client.constants.emojis.loading} | Closing the ticket in **5 seconds**...`);

		setTimeout(async () => {
			await channel.delete(`Ticket deleted by ${author.id}`).catch(() => void 0);
			await this.client.prisma.ticket.delete({ where: { caseId: ticket.caseId } }).catch(() => void 0);
		}, 5e3);
	}
}
