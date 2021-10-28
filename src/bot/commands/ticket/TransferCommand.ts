import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage } from "../../../client/structures/Moderation";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "transfer",
	description: "transfer a ticket",
	usage: "<user>",
	preconditions: ["ModeratorOnly", "GuildOnly"],
})
export default class TransferCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		if (!message.channel.name.startsWith("ticket-")) return;

		const [, id] = message.channel.name.split(/-/g);
		const ticket = await this.client.prisma.ticket.findFirst({ where: { caseId: Number(id) } });
		if (
			!ticket ||
			ticket.closed ||
			(message.author.id !== ticket.claimer &&
				!this.client.permissionHandler.hasSenior(message.member))
		)
			return;

		const { value: member } = await args.pickResult("member");
		if (!member)
			return message.reply(
				`>>> ${emojis.redcross} | Was not able to find the user in this server.`
			);

		if (!this.client.permissionHandler.hasMod(member) || member.user.bot)
			return message.reply(
				`>>> ${emojis.redcross} | ${member.toString()} is not a **moderator+**.`
			);

		ticket.claimer = member.id;
		await this.client.prisma.ticket.update({ where: { caseId: ticket.caseId }, data: ticket });

		if (!this.client.permissionHandler.hasSenior(message.member))
			await message.channel.permissionOverwrites.create(message.author, {
				VIEW_CHANNEL: false,
			});

		await message.channel.permissionOverwrites.create(member, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true,
			ATTACH_FILES: true,
		});

		const user = await this.client.utils.fetchUser(ticket.id.split(/-/g)[0]);
		if (user)
			await user
				.send(
					`>>> ${emojis.transfer} | Your ticket has been transferred to **${
						member.nickname || member.user.username
					}** (${member.toString()})`
				)
				.catch(() => void 0);

		await message.channel.send({
			content: `>>> 👋 | Hey ${member.toString()}, check the pins for more information about this ticket!`,
			allowedMentions: { users: [member.id] },
		});
	}
}
