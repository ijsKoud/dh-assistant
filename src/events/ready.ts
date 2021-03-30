import { GuildMember } from "discord.js";
import { Listener } from "discord-akairo";
import ms from "ms";
import Ban from "../model/moderation/Ban";
import Mute from "../model/moderation/Mute";
import fetch from "node-fetch";

const max = 2147483647;

export default class ready extends Listener {
	constructor() {
		super("ready", {
			emitter: "client",
			event: "ready",
		});
	}

	async exec() {
		this.client.log("INFO", `**${this.client.user.tag}** has logged in!`);
		await this.client.user.setStatus("dnd");

		const url: string =
			"https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCkMrp3dJhWz2FcGTzywQGWg&key=" +
			process.env.YOUTUBE_API_KEY;

		const data = await (await fetch(url)).json().catch((e) => {
			this.client.log("ERROR", `Youtube Fetch Error: \`\`\`${e}\`\`\``);
			return { items: [{ statistics: { subscriberCount: "unkown" } }] };
		});
		const subCount = data.items[0].statistics.subscriberCount;
		this.client.user.setActivity(`with ${subCount} subscribers!`, {
			type: "PLAYING",
		});

		setInterval(async () => {
			const data = await (await fetch(url)).json().catch((e) => {
				this.client.log("ERROR", `Youtube Fetch Error: \`\`\`${e}\`\`\``);
				return { items: [{ statistics: { subscriberCount: "unkown" } }] };
			});
			const subCount = data.items[0].statistics.subscriberCount;
			this.client.user.setActivity(`with ${subCount} subscribers!`, {
				type: "PLAYING",
			});
		}, 6e5);

		setInterval(async () => {
			const bans = await Ban.find();
			const bValid = bans
				.map((b) => {
					return b.date - Date.now() <= 0
						? {
								delete: true,
								guildId: b.guildId,
								userId: b.userId,
								reason: `${b.moderator}|Automatic unban from ban made ${ms(b.duration, {
									long: true,
								})} ago by <@${b.moderator}>`,
						  }
						: {
								delete: true,
								guildId: b.guildId,
								userId: b.userId,
								reason: `${b.moderator}|Automatic unban from ban made ${ms(b.duration, {
									long: true,
								})} ago by <@${b.moderator}>`,
								duration: b.date - Date.now(),
						  };
				})
				.filter((b) => b?.delete);

			bValid.forEach(async (b) => {
				if (b.duration) {
					if (max <= b.duration || this.client.map.has(b.userId + "-ban")) return;
					this.client.map.set(b.userId + "-ban", {
						guildId: b.guildId,
						type: "ban",
						userId: b.userId,
						timer: setTimeout(async () => {
							const guild = this.client.guilds.cache.get(b.guildId);
							if (guild) await guild.members.unban(b.userId, b.reason).catch((e) => null);

							await Ban.findOneAndRemove({ userId: b.userId, guildId: b.guildId });
						}, b.duration),
					});
				} else {
					const guild = this.client.guilds.cache.get(b.guildId);
					if (guild) await guild.members.unban(b.userId, b.reason).catch((e) => null);

					await Ban.findOneAndRemove({ userId: b.userId, guildId: b.guildId });
				}
			});

			const mutes = await Mute.find();
			const mValid = mutes
				.map((b) => {
					return b.date - Date.now() <= 0
						? {
								delete: true,
								guildId: b.guildId,
								userId: b.userId,
								reason: `Automatic unmute from mute made ${ms(b.duration, {
									long: true,
								})} ago by <@${b.moderator}>`,
						  }
						: {
								delete: true,
								guildId: b.guildId,
								userId: b.userId,
								reason: `Automatic unmute from mute made ${ms(b.duration, {
									long: true,
								})} ago by <@${b.moderator}>`,
								duration: b.date - Date.now(),
						  };
				})
				.filter((b) => b?.delete);

			mValid.forEach(async (b) => {
				if (b.duration) {
					if (max <= b.duration || this.client.map.has(b.userId + "-mute")) return;
					this.client.map.set(b.userId + "-mute", {
						guildId: b.guildId,
						type: "mute",
						userId: b.userId,
						timer: setTimeout(async () => {
							const guild = this.client.guilds.cache.get(b.guildId);
							if (guild) {
								const member: GuildMember = await this.client.utils
									.fetchMember(b.userId, guild)
									.catch((e) => null);
								if (member) {
									await member.roles.remove(this.client.config.muteRole).catch((e) => null);
									this.client.emit("muteEvent", member, guild.me, b.reason);
								}
							}

							await Mute.findOneAndRemove({ userId: b.userId, guildId: b.guildId });
						}, b.duration),
					});
				} else {
					const guild = this.client.guilds.cache.get(b.guildId);
					if (guild) {
						const member: GuildMember = await this.client.utils
							.fetchMember(b.userId, guild)
							.catch((e) => null);
						if (member) {
							await member.roles.remove(this.client.config.muteRole).catch((e) => null);
							this.client.emit("muteEvent", member, guild.me, b.reason);
						}
					}

					await Mute.findOneAndRemove({ userId: b.userId, guildId: b.guildId });
				}
			});
		}, 6e4);
		this.client.giveaway.loadAll();
	}
}
