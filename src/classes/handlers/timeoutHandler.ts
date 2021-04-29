import moment from "moment";
import modtechClient from "../../client/client";
import { iLogs } from "../../models/interfaces";
import Logs from "../../models/logging/Logs";

export default class timeoutHandler {
	public cache = new Map<string, NodeJS.Timeout>();
	public max = 2147483647;

	constructor(private client: modtechClient) {
		setInterval(() => this.loadAll(), 6e4);
	}

	public async loadAll(): Promise<void> {
		(await Logs.find()).forEach((l) => this.load(l));
	}

	public async load(data: iLogs): Promise<void> {
		switch (data.type) {
			case "ban":
				{
					if (!data.endDate || this.cache.has(`BAN-${data.guildId}-${data.userId}`)) return;
					const guild = this.client.guilds.cache.get(data.guildId);
					if (!guild) return this.delete(data);

					if (data.endDate - Date.now() <= this.max) {
						const timeout = setTimeout(async () => {
							await guild.members.unban(
								data.userId,
								`Automatic unban from ban made by <@${data.moderator}> ${moment(
									data.startDate
								).fromNow()} ago`
							);
							this.delete(data);
						}, data.endDate - Date.now());
						this.cache.set(`BAN-${data.guildId}-${data.userId}`, timeout);
					}
				}
				break;
			case "mute":
				{
					if (!data.endDate || this.cache.has(`MUTE-${data.guildId}-${data.userId}`)) return;
					const guild = this.client.guilds.cache.get(data.guildId);
					if (!guild) return this.delete(data);

					const member = await this.client.utils.fetchMember(data.userId, guild);
					const user = member ? member.user : await this.client.utils.fetchUser(data.userId);
					const moderator = await this.client.utils.fetchUser(data.moderator);

					if (data.endDate - Date.now() <= this.max) {
						const reason = `Automatic unmute from mute made by ${moderator.toString()} ${moment(
							data.startDate
						).fromNow()} ago`;
						const timeout = setTimeout(async () => {
							await member?.roles?.remove(guild.automod?.mutes.role, reason).catch((e) => null);
							this.client.loggingHandler.unmute(user, moderator, { ...data, reason });
							this.delete(data);
						}, data.endDate - Date.now());

						this.cache.set(`MUTE-${data.guildId}-${data.userId}`, timeout);
					}
				}
				break;
			default:
				break;
		}
	}

	public async delete(data: any): Promise<void> {
		clearTimeout(this.cache.get(`${data.type.toUpperCase()}-${data.guildId}-${data.userId}`));
		this.cache.delete(`${data.type.toUpperCase()}-${data.guildId}-${data.userId}`);

		data
			.delete?.()
			.catch?.((e: Error) =>
				this.client.log("ERROR", `timeoutHandler#delete() Error: \`\`\`${e}\`\`\``)
			);
	}
}
