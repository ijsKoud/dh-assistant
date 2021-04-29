import { Guild, GuildAuditLogs, User } from "discord.js";
import { Listener } from "discord-akairo";
import Logs from "../../models/logging/Logs";
import moment from "moment";

export default class guildBanRemove extends Listener {
	constructor() {
		super("guildBanRemove", {
			emitter: "client",
			event: "guildBanRemove",
		});
	}

	async exec(guild: Guild, user: User) {
		try {
			if (user.partial) user = await user.fetch();
			const ban = await Logs.findOne({ userId: user.id, guildId: guild.id, type: "unban" });
			if (ban) await ban.delete().catch((e) => null);

			let obj: any;
			if (ban) {
				const moderator = await this.client.utils.fetchUser(ban.moderator);
				obj = {
					reason: ban.endDate
						? `Automatic unban from ban made by ${moderator.toString()} ${moment(
								ban.startDate
						  ).fromNow()}`
						: ban.reason,
					guild,
					moderator,
					user,
				};
			} else {
				const infractions: GuildAuditLogs = await guild
					.fetchAuditLogs({
						limit: 100,
						type: "MEMBER_BAN_REMOVE",
					})
					.catch((e) => null);
				if (!infractions) return;

				const infraction = infractions.entries.find(
					// @ts-expect-error
					(i) => i.targetType === "USER" && i.target.id === user.id
				);
				if (!infraction) return;
				obj = {
					reason: infraction.reason,
					guild,
					moderator: infraction.executor,
					user,
				};
			}

			this.client.loggingHandler.unban(obj);
		} catch (e) {
			this.client.log("ERROR", `guildBanRemove event error: \`\`\`${e.stack || e.message}\`\`\``);
		}
	}
}
