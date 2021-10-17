import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import axios from "axios";
import { setTimeout as setLongTimeout } from "long-timeout";
import { ModerationMessage } from "../../client/structures/Moderation";
import moment from "moment";
import { GuildMember } from "discord.js";

@ApplyOptions<ListenerOptions>({ once: true, event: "ready" })
export default class ReadyListener extends Listener {
	public run(): void {
		this.container.client.loggers
			.get("bot")
			?.info(`${this.container.client.user?.tag} has logged in!`);

		this.setStatus();
		this.loadTimeouts();
	}

	private async loadTimeouts() {
		const { client } = this.container;
		const logs = await client.prisma.modlog.findMany({
			where: { id: { endsWith: process.env.GUILD } },
		});
		const filtered = logs.filter((log) => ["tempban", "mute"].includes(log.type));

		filtered.forEach((log) => {
			if (log.timeoutFinished) return;

			switch (log.type) {
				case "tempban":
					{
						const automod = client.automod;
						const date = Number(log.startDate);
						const finished = Number(log.endDate);

						const timeout = setLongTimeout(async () => {
							const reason = `Automatic unban from ban made by <@${log.moderator}> <t:${moment(
								date
							).unix()}:R>`;

							const [userId, guildId] = log.id.split("-");
							const guild = client.guilds.cache.get(guildId);
							const user = (await client.utils.fetchUser(userId)) || {
								displayAvatarURL: () => "https://static.daangamesdg.xyz/discord/wumpus.png",
								id: userId,
								tag: "User#0000",
							};
							const moderator = (await client.utils.fetchUser(log.moderator)) || {
								displayAvatarURL: () => "https://static.daangamesdg.xyz/discord/wumpus.png",
								id: log.moderator,
								tag: "User#0000",
							};

							const finishLogs = ModerationMessage.logs(
								reason,
								"unban",
								user,
								moderator,
								`Reference Case Id: ${log.caseId}`,
								finished
							);

							if (guild) await guild.bans.remove(userId, reason);
							await client.prisma.modlog.update({
								where: { caseId: log.caseId },
								data: { timeoutFinished: true },
							});
							client.loggingHandler.sendLogs(finishLogs, "mod", automod.settings.logging.mod);
						}, finished - Date.now());

						automod.modTimeouts.set(`${log.id}-ban`, {
							timeout,
							caseId: log.caseId,
						});
					}
					break;
				case "mute":
					{
						const automod = client.automod;
						const date = Number(log.startDate);
						const finished = Number(log.endDate);

						const timeout = setLongTimeout(async () => {
							const reason = `Automatic unmute from mute made by <@${log.moderator}> <t:${moment(
								date
							).unix()}:R>`;

							const [userId, guildId] = log.id.split("-");
							const guild = client.guilds.cache.get(guildId);
							const member = (await client.utils.fetchMember(userId, guild)) || {
								user: {
									displayAvatarURL: () => "https://static.daangamesdg.xyz/discord/wumpus.png",
									id: userId,
									tag: "User#0000",
								},
							};
							const moderator = (await client.utils.fetchUser(log.moderator)) || {
								displayAvatarURL: () => "https://static.daangamesdg.xyz/discord/wumpus.png",
								id: log.moderator,
								tag: "User#0000",
							};

							const finishLogs = ModerationMessage.logs(
								reason,
								"unmute",
								member.user,
								moderator,
								`Reference Case Id: ${log.caseId}`,
								finished,
								client.automod.settings.mute.duration
							);

							if (member instanceof GuildMember)
								await member.roles.remove(automod.settings.mute.role).catch(() => void 0);
							await client.prisma.modlog.update({
								where: { caseId: log.caseId },
								data: { timeoutFinished: true },
							});
							client.loggingHandler.sendLogs(finishLogs, "mod", automod.settings.logging.mod);
						}, finished - Date.now());

						automod.modTimeouts.set(`${log.id}-mute`, {
							timeout,
							caseId: log.caseId,
						});
					}
					break;
				default:
					break;
			}
		});
	}

	private async setStatus() {
		const { client } = this.container;
		if (process.env.NODE_ENV === "development")
			return client.user?.setPresence({
				status: "dnd",
				activities: [
					{
						type: "PLAYING",
						name: "with unknown subscribers!",
					},
				],
			});

		const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCkMrp3dJhWz2FcGTzywQGWg&key=${process.env.YOUTUBE_API_KEY}`;
		const { data } = await axios
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.get<any>(url)
			.catch(() => ({ data: { items: [{ statistics: { subscriberCount: "unkown" } }] } }));

		const subCount = data.items[0].statistics.subscriberCount;

		client.user?.setPresence({
			status: "dnd",
			activities: [
				{
					type: "PLAYING",
					name: `with ${subCount} subscribers!`,
				},
			],
		});

		setInterval(this.setStatus.bind(this), 6e5);
	}
}
