import { ListenerOptions, Listener } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { DMChannel, GuildChannel } from "discord.js";

@ApplyOptions<ListenerOptions>({ event: "channelDelete" })
export class ChannelDeleteListener extends Listener {
	public async run(channel: DMChannel | GuildChannel) {
		const { client } = this.container;

		if (channel.type !== "DM" && channel.guildId !== client.constants.guild) return;
		if (!channel.isText()) return;
		const ticket = await client.prisma.ticket.findFirst({ where: { channel: channel.id } });
		if (ticket) return client.prisma.ticket.delete({ where: { caseId: ticket.caseId } });
	}
}
