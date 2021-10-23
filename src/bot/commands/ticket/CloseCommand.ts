import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage } from "../../../client/structures/Moderation";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "close",
	aliases: ["closeticket"],
	description: "Close a ticket",
	requiredClientPermissions: ["MANAGE_CHANNELS"],
	preconditions: ["ModeratorOnly"],
})
export default class CloseCommand extends Command {
	public async messageRun(message: GuildMessage): Promise<void> {
		if (!message.channel.isText() || message.channel.type === "DM") return;
		if (!message.channel.name.startsWith("ticket-")) return;

		const { channel, author, member } = message;
		const ticket = await this.client.prisma.ticket.findFirst({
			where: { caseId: Number(channel.name.split("-")[1]) },
		});
		if (
			!ticket ||
			ticket.closed ||
			(!ticket.id.includes(author.id) && !this.client.permissionHandler.hasSenior(message.member))
		)
			return;

		ticket.closed = true;
		await this.client.prisma.ticket.update({ where: { caseId: ticket.caseId }, data: ticket });

		const user = await this.client.utils.fetchUser(ticket.id.split("-")[1]);
		const msg = await channel.send(`>>> ${emojis.loading} | Closing the ticket...`);
		if (user)
			await user.send(
				`>>> 👋 | Your ticket (${ticket.caseId}) has been closed by **${
					member.nickname || author.username
				}** (${author.toString()})`
			);

		// to do: transcript the app

		await msg.edit(`>>> ${emojis.loading} | Closing the ticket in **5 seconds**...`);

		setTimeout(async () => {
			await channel.delete(`Ticket deleted by ${author.id}`).catch(() => void 0);
			await this.client.prisma.ticket
				.delete({ where: { caseId: ticket.caseId } })
				.catch(() => void 0);
		}, 5e3);
	}
}
