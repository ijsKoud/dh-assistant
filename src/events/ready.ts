import { Listener } from "discord-akairo";
import ms from "ms";
import Ban from "../model/moderation/Ban";
import Mute from "../model/moderation/Mute";

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
		this.client.user.setActivity("with the ban hammer", {
			type: "PLAYING",
		});
		setInterval(
			() =>
				this.client.user.setActivity("with the ban hammer", {
					type: "PLAYING",
				}),
			864e5
		);

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
								reason: `${b.moderator}|Automatic unmute from ban made ${ms(b.duration, {
									long: true,
								})} ago by <@${b.moderator}>`,
						  }
						: {
								delete: true,
								guildId: b.guildId,
								userId: b.userId,
								reason: `${b.moderator}|Automatic unmute from ban made ${ms(b.duration, {
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
								const member = await this.client.utils.fetchMember(b.userId, guild);
								if (member)
									await member.roles.remove(this.client.config.muteRole).catch((e) => null);
							}

							await Mute.findOneAndRemove({ userId: b.userId, guildId: b.guildId });
						}, b.duration),
					});
				}
				const guild = this.client.guilds.cache.get(b.guildId);
				if (guild) {
					const member = await this.client.utils.fetchMember(b.userId, guild);
					if (member) await member.roles.remove(this.client.config.muteRole).catch((e) => null);
				}

				await Mute.findOneAndRemove({ userId: b.userId, guildId: b.guildId });
			});
		}, 6e4);
	}
}
