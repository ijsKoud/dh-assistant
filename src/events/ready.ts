import { MessageEmbed } from "discord.js";
import { Listener } from "discord-akairo";
import fetch from "node-fetch";
import notification from "../api/api";
import dhClient from "../client/client";
import { modlog, muteRole } from "../client/config";
import tempban from "../models/tempban";
import ms from "ms";
import mute from "../models/mute";

export default class ready extends Listener {
	constructor() {
		super("ready", {
			emitter: "client",
			event: "ready",
			category: "client",
		});
	}

	async exec(): Promise<void> {
		// client stuff
		this.client.log(`✅ | **${this.client.user.tag}** has logged in!`);
		await this.client.user.setStatus("dnd");

		const url: string =
			"https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCkMrp3dJhWz2FcGTzywQGWg&key=" +
			process.env.YOUTUBE_API_KEY;

		const data = await (await fetch(url)).json().catch((e) => {
			this.client.log(`⚠ | Youtube Fetch Error: \`${e}\``);
			return { items: [{ statistics: { subscriberCount: "unkown" } }] };
		});
		const subCount = data.items[0].statistics.subscriberCount;
		this.client.user.setActivity(`with ${subCount} subscribers!`, {
			type: "PLAYING",
		});

		setInterval(async () => {
			const data = await (await fetch(url)).json().catch((e) => {
				this.client.log(`⚠ | Youtube Fetch Error: \`${e}\``);
				return { items: [{ statistics: { subscriberCount: "unkown" } }] };
			});
			const subCount = data.items[0].statistics.subscriberCount;
			this.client.user.setActivity(`with ${subCount} subscribers!`, {
				type: "PLAYING",
			});
		}, 6e5);

		if (this.client.user.id !== "711468893457088553")
			new notification(this.client as dhClient).start();

		const bans = await tempban.find();
		bans.forEach(async (b) => {
			if ((b.get("endDate") as number) - Date.now() < 0) {
				const guild = this.client.guilds.cache.get(b.get("guildId"));
				guild.members.unban(
					b.get("id"),
					`Automatic unban from tempban made ${ms(b.get("duration"))} ago by <@${b.get(
						"moderator"
					)}>`
				);

				const channel = await this.client.utils.getChannel(modlog);
				const user = await this.client.utils.fetchUser(b.get("id"));
				channel.send(
					new MessageEmbed()
						.setColor("#4AF3AB")
						.setAuthor(`🔨 Unban | ${user.tag}`)
						.setDescription(`Responsable moderator: <@${b.get("moderator")}>`)
						.addField(
							"• Reason",
							`Automatic unban from tempban made ${ms(b.get("duration"))} ago by <@${b.get(
								"moderator"
							)}>`
						)
				);

				b.delete();
			}
		});

		const mutes = await mute.find();
		mutes.forEach(async (m) => {
			if ((m.get("endDate") as number) - Date.now() < 0) {
				const guild = this.client.guilds.cache.get(m.get("guildId"));

				const user = await this.client.util
					.fetchMember(guild, m.get("id"), true)
					.catch((e) => null);
				if (!user) return m.delete();
				const mod = await this.client.utils.fetchUser(m.get("moderator"));
				if (user) user.roles.remove(muteRole);
				this.client.emit(
					"muteEvent",
					"unmute",
					user,
					mod,
					`Automatic mute from mute made ${ms(m.get("duration"))} ago by <@${m.get("moderator")}>`
				);
				m.delete();
			}
		});

		this.client.log(
			`ℹ | **${bans.length}** temp bans and **${mutes.length}** mutes found for this server!`
		);

		setInterval(async () => {
			const bans = await tempban.find();
			bans.forEach(async (b) => {
				if ((b.get("endDate") as number) - Date.now() < 0) {
					const guild = this.client.guilds.cache.get(b.get("guildId"));
					guild.members.unban(
						b.get("id"),
						`Automatic unban from tempban made ${ms(b.get("duration"))} ago by <@${b.get(
							"moderator"
						)}>`
					);

					const channel = await this.client.utils.getChannel(modlog);
					const user = await this.client.utils.fetchUser(b.get("id"));

					channel.send(
						new MessageEmbed()
							.setColor("#4AF3AB")
							.setAuthor(`🔨 Unban | ${user.tag}`)
							.setDescription(`Responsable moderator: <@${b.get("moderator")}>`)
							.addField(
								"• Reason",
								`Automatic unban from tempban made ${ms(b.get("duration"))} ago by <@${b.get(
									"moderator"
								)}>`
							)
					);
					b.delete();
				}
			});

			const mutes = await mute.find();
			mutes.forEach(async (m) => {
				if ((m.get("endDate") as number) - Date.now() < 0) {
					const guild = this.client.guilds.cache.get(m.get("guildId"));

					const user = await this.client.util.fetchMember(guild, m.get("id"), true);
					const mod = await this.client.utils.fetchUser(m.get("moderator"));
					if (user) user.roles.remove(muteRole);

					this.client.emit(
						"muteEvent",
						"unmute",
						user,
						mod,
						`Automatic mute from mute made ${ms(m.get("duration"))} ago by <@${m.get("moderator")}>`
					);
					m.delete();
				}
			});
		}, 6e4);
	}
}
