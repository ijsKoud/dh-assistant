import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildBan } from "discord.js";
import { ModerationMessage } from "../../../client/structures/Moderation";

@ApplyOptions<ListenerOptions>({ event: "guildBanAdd" })
export default class GuildBanAddListener extends Listener {
	public async run(ban: GuildBan): Promise<void> {
		const { client } = this.container;
		if (ban.partial) await ban.fetch();

		const modlog = await client.prisma.modlog.findFirst({
			where: { id: { startsWith: ban.user.id }, type: { contains: "ban" } },
		});
		if (modlog) return;

		const infractions = await ban.guild
			.fetchAuditLogs({
				limit: 10,
				type: "MEMBER_BAN_ADD",
			})
			.catch(() => null);
		if (!infractions) return;

		const infraction = infractions.entries.find(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(i) => i.targetType === "USER" && (i.target as any)?.id === ban.user.id
		);
		if (!infraction) return;

		const log = ModerationMessage.logs(
			ban.reason ?? "No reason provided",
			"ban",
			ban.user,
			infraction.executor || {
				displayAvatarURL: () => "https://static.daangamesdg.xyz/discord/wumpus.png",
				id: "",
				tag: "User#0000",
			},
			"Case Id: none",
			Date.now()
		);

		client.loggingHandler.sendLogs(log, "mod");
	}
}
