import { GuildMember, Message, User } from "discord.js";
import ms from "ms";
import modtechClient from "../../client/client";
import { iAutomod, iLogs as Mute, iWarn as warn } from "../../models/interfaces";
import AutomodConfig from "../../models/guild/Automod";
import Warn from "../../models/logging/Warn";
import Logs from "../../models/logging/Logs";

interface iWarn extends warn {
	type?: "caps" | "mention" | "spam" | "blacklisted";
}

interface iMute extends Mute {
	warnType?: "caps" | "mention" | "spam" | "blacklisted";
}

interface sFilterObj {
	msgCount: number;
	lastMessage: Message;
	timer: NodeJS.Timeout;
}

interface mFilterObj {
	mCount: number;
	lastMessage: Message;
	timer: NodeJS.Timeout;
}

export default class Automod {
	constructor(public client: modtechClient) {}

	public spamfilter: Map<string, sFilterObj> = new Map();
	public mentionfilter: Map<string, mFilterObj> = new Map();
	public types = {
		caps: "Too many caps!",
		mention: "Mass mentioning users is not allowed.",
		spam: "Spamming is not tolerated.",
		blacklisted: "You aren't allowed to use banned words.",
	};

	public check(message: Message, data: iAutomod) {
		(data.enabled
			? [
					this.caps(message, data),
					this.mention(message, data),
					this.spam(message, data),
					this.blacklisted(message, data),
			  ].filter((x) => x !== null)
			: []
		).forEach(async (x) => {
			this.punish(message, { warn: x, automod: data });
		});
	}

	public async warn(message: Message, user: User, data: iWarn, automod: iAutomod) {
		const reason = this.types[data.type] || data.reason.substr(0, 1800);
		const dm = await user
			.send(this.client.responses.warn(message.guild.name, reason))
			.catch((e) => null);

		await message.channel
			.send(
				`>>> 💡 | **${
					data.moderator === this.client.user.id ? "Automod - Warn" : "Warning given"
				}**\nSuccessfully warned **${user.tag}** for **${reason}**.${
					dm ? "" : "\nℹ | I was unable to DM this user, their warn has been recorded."
				}`
			)
			.catch((e) => null);

		const warns = await Warn.find({ guildId: message.guild.id });
		const caseId = `#${
			Number((warns.sort((a, b) => b.date - a.date).shift()?.caseId || "#0").slice(1)) + 1
		}`;
		const warn = await Warn.create({
			guildId: message.guild.id,
			userId: data.userId,
			moderator: data.moderator,
			date: Date.now(),
			caseId,
			reason,
		});

		const moderator = await this.client.utils.fetchUser(data.moderator);
		const guild = this.client.guilds.cache.get(data.guildId);
		await this.client.loggingHandler.warn(message, moderator, warn);

		const userWarns = await Warn.find({ guildId: message.guild.id, userId: user.id });
		if (userWarns.length % 2 === 0 && userWarns.length && automod.mutes.duration)
			this.mute(
				message,
				await this.client.utils.fetchMember(data.userId, guild),
				{
					...data,
					type: "mute",
					reason: "Automatic mute for every 2 warns",
					endDate: Date.now() + automod.mutes.duration,
					startDate: Date.now(),
				},
				automod.mutes.role
			);
	}

	public async mute(message: Message, user: GuildMember, data: iMute, id: string) {
		const reason = this.types[data.type] || data.reason.substr(0, 1500);
		const role = await this.client.utils.getRole(id, message.guild);

		const dm = await user
			.send(
				this.client.responses.mute(
					message.guild.name,
					reason,
					ms(data.endDate - data.startDate || 0, { long: true })
				)
			)
			.catch((e) => null);
		await message.channel
			.send(
				`>>> 💡 | **${
					data.moderator === this.client.user.id ? "Automod - Mute" : "Mute given"
				}**\nSuccessfully muted **${user.user.tag}** for **${ms(
					data.endDate - data.startDate || 0,
					{
						long: true,
					}
				)}**\nReason: **${reason}**.${
					dm ? "" : "\nℹ | I was unable to DM this user, their mute has been recorded."
				}`
			)
			.catch((e) => null);

		await user.roles.add(role);
		this.client.timeoutHandler.load(data);

		const moderator = await this.client.utils.fetchUser(data.moderator);
		const mute = await Logs.create(data);

		await this.client.loggingHandler.mute(message, moderator, mute);
		await this.client.timeoutHandler.load(mute);
	}

	public async unmute(message: Message, user: GuildMember, data: iMute, id: string) {
		const reason = data.reason.substr(0, 1500);
		const role = await this.client.utils.getRole(id, message.guild);
		const moderator = await this.client.utils.fetchUser(data.moderator);

		await Logs.findOneAndDelete({
			guildId: data.guildId,
			userId: user.id,
			moderator: data.moderator,
			type: "mute",
		});

		await this.client.timeoutHandler.delete({ type: "mute", ...data });
		this.client.loggingHandler.unmute(user.user, moderator, data);

		await user?.roles?.remove(role, reason).catch((e) => null);
		await message.channel
			.send(
				`>>> 💡 | **${
					data.moderator === this.client.user.id ? "Automod - Unmute" : "Unmute given"
				}**\nSuccessfully unmuted **${user.user.tag}** for  **${reason}**.`
			)
			.catch((e) => null);
	}

	public async update(data: iAutomod) {
		try {
			this.client.Automod.set(data.guildId, data);
			await AutomodConfig.findOneAndUpdate({ guildId: data.guildId }, data);
		} catch (e) {
			this.client.log(
				"ERROR",
				`Automod#update(data: iAutomod) error: \`\`\`${e.stack || e.message}\`\`\`\``
			);
		}
	}

	private async punish(message: Message, { warn, automod }: { warn: iWarn; automod: iAutomod }) {
		switch (automod[warn.type].action) {
			case "verbal":
				{
					if (warn.type === "blacklisted") await message.delete().catch((e) => null);
					await message.channel
						.send(`>>> 💡 | ${message.author.toString()}, **${this.types[warn.type]}**`)
						.catch((e) => null);
				}
				break;
			default:
			case "warn":
				{
					if (warn.type === "blacklisted") await message.delete().catch((e) => null);
					await this.warn(message, message.author, warn, automod);
				}
				break;
			case "mute":
				{
					const date = Date.now();
					if (warn.type === "blacklisted") await message.delete().catch((e) => null);
					await this.mute(
						message,
						message.member,
						{
							...warn,
							type: "mute",
							warnType: warn.type,
							endDate: date + automod.mutes.duration,
							startDate: date,
						},
						automod.mutes.role
					);
				}
				break;
		}
	}

	private caps(message: Message, { caps }: iAutomod): iWarn {
		if (
			!caps.enabled ||
			caps.whitelisted.includes(`CHANNEL-${message.channel.id}`) ||
			caps.whitelisted.includes(`USER-${message.author.id}`)
		)
			return null;

		let bypass = false;
		const roles = caps.whitelisted
			.map((str) => (str.includes("ROLE-") ? str.slice(5) : null))
			.filter((str) => str)
			.join("-");
		message.member.roles.cache.forEach(({ id }) => (bypass = roles.includes(id) ? true : bypass));
		if (bypass) return null;

		const arr = message.content
			.trim()
			.toLowerCase()
			.split("")
			.filter((c) => c.match(/[a-z]/g));

		if (arr.length <= 10) return null;
		if (message.content === message.content.toUpperCase())
			return {
				guildId: message.guild.id,
				moderator: this.client.user.id,
				reason: "Too many caps!",
				userId: message.author.id,
				type: "caps",
				date: Date.now(),
			};

		const res = arr
			.map((str): number => (str === str.toUpperCase() ? 1 : 0))
			.reduce((a, b) => a + b);

		if (arr.length * 0.75 <= res)
			return {
				guildId: message.guild.id,
				moderator: this.client.user.id,
				reason: "Too many caps!",
				userId: message.author.id,
				type: "caps",
				date: Date.now(),
			};

		return null;
	}

	private spam(message: Message, { spam }: iAutomod): iWarn {
		if (
			!spam.enabled ||
			spam.whitelisted.includes(`CHANNEL-${message.channel.id}`) ||
			spam.whitelisted.includes(`USER-${message.author.id}`)
		)
			return null;

		let bypass = false;
		const roles = spam.whitelisted
			.map((str) => (str.includes("ROLE-") ? str.slice(5) : null))
			.filter((str) => str)
			.join("-");
		message.member.roles.cache.forEach(({ id }) => (bypass = roles.includes(id) ? true : bypass));
		if (bypass) return null;

		if (this.spamfilter.has(`${message.author.id}-${message.guild.id}`)) {
			const { lastMessage, timer, msgCount } = this.spamfilter.get(
				`${message.author.id}-${message.guild.id}`
			);
			const difference = message.createdTimestamp - lastMessage.createdTimestamp;
			let messageCount: number = msgCount;

			if (difference > 2500) {
				clearTimeout(timer);
				this.spamfilter.set(`${message.author.id}-${message.guild.id}`, {
					msgCount: 1,
					lastMessage: message,
					timer: setTimeout(
						() => this.spamfilter.delete(`${message.author.id}-${message.guild.id}`),
						spam.threshold.seconds * 1000
					),
				});
			} else {
				++messageCount;
				if (messageCount === spam.threshold.messages) {
					this.spamfilter.set(`${message.author.id}-${message.guild.id}`, {
						lastMessage: message,
						msgCount: 1,
						timer,
					});
					return {
						guildId: message.guild.id,
						moderator: this.client.user.id,
						reason: `Automatic action carried out for hitting the message rate limit (${spam.threshold.messages}/${spam.threshold.seconds}s)`,
						userId: message.author.id,
						type: "spam",
						date: Date.now(),
					};
				} else {
					this.spamfilter.set(`${message.author.id}-${message.guild.id}`, {
						lastMessage: message,
						msgCount: messageCount,
						timer,
					});
				}
			}
		} else {
			let fn = setTimeout(
				() => this.spamfilter.delete(`${message.author.id}-${message.guild.id}`),
				spam.threshold.seconds * 1000
			);
			this.spamfilter.set(`${message.author.id}-${message.guild.id}`, {
				msgCount: 1,
				lastMessage: message,
				timer: fn,
			});
		}

		return null;
	}

	private mention(message: Message, { mention }: iAutomod): iWarn {
		if (
			!mention.enabled ||
			mention.whitelisted.includes(`CHANNEL-${message.channel.id}`) ||
			mention.whitelisted.includes(`USER-${message.author.id}`)
		)
			return null;

		let bypass = false;
		const roles = mention.whitelisted
			.map((str) => (str.includes("ROLE-") ? str.slice(5) : null))
			.filter((str) => str)
			.join("-");
		message.member.roles.cache.forEach(({ id }) => (bypass = roles.includes(id) ? true : bypass));
		if (bypass) return null;

		if (this.mentionfilter.has(`${message.author.id}-${message.guild.id}`)) {
			const { lastMessage, timer, mCount } = this.mentionfilter.get(
				`${message.author.id}-${message.guild.id}`
			);
			const difference = message.createdTimestamp - lastMessage.createdTimestamp;
			let mentionCount: number = mCount;

			if (difference > 2500) {
				clearTimeout(timer);
				this.mentionfilter.set(`${message.author.id}-${message.guild.id}`, {
					mCount: 1,
					lastMessage: message,
					timer: setTimeout(
						() => this.mentionfilter.delete(`${message.author.id}-${message.guild.id}`),
						mention.threshold.seconds * 1000
					),
				});
			} else {
				mentionCount +=
					message.mentions.members?.filter((m) => !m.user.bot && m.id !== message.author.id)
						?.size ?? 0;
				if (mentionCount >= mention.threshold.messages) {
					this.mentionfilter.set(`${message.author.id}-${message.guild.id}`, {
						lastMessage: message,
						mCount: 1,
						timer,
					});
					return {
						guildId: message.guild.id,
						moderator: this.client.user.id,
						reason: `Automatic action carried out for mass mentioning users in the server (${mention.threshold.messages}/${mention.threshold.seconds}s)`,
						userId: message.author.id,
						type: "mention",
						date: Date.now(),
					};
				} else {
					this.mentionfilter.set(`${message.author.id}-${message.guild.id}`, {
						lastMessage: message,
						mCount: mentionCount,
						timer,
					});
				}
			}
		} else {
			let fn = setTimeout(
				() => this.mentionfilter.delete(`${message.author.id}-${message.guild.id}`),
				mention.threshold.seconds * 1000
			);
			this.mentionfilter.set(`${message.author.id}-${message.guild.id}`, {
				mCount: 1,
				lastMessage: message,
				timer: fn,
			});
		}

		return null;
	}

	private blacklisted(message: Message, { blacklisted }: iAutomod): iWarn {
		if (
			!blacklisted.words.blacklisted.length ||
			blacklisted.whitelisted.includes(`CHANNEL-${message.channel.id}`) ||
			blacklisted.whitelisted.includes(`USER-${message.author.id}`)
		)
			return null;

		let bypass = false;
		const roles = blacklisted.whitelisted
			.map((str) => (str.includes("ROLE-") ? str.slice(5) : null))
			.filter((str) => str)
			.join("-");
		message.member.roles.cache.forEach(({ id }) => (bypass = roles.includes(id) ? true : bypass));
		if (bypass) return null;

		const words = message.content
			.toLowerCase()
			.replace(/\|/g, "")
			.split(/\s+/)
			.map((word) =>
				blacklisted.words.blacklisted.some((str) => word.includes(str.toLowerCase())) &&
				!blacklisted.words.whitelisted.some((str) => word.includes(str.toLowerCase()))
					? word
					: null
			)
			.filter((w) => w !== null)
			.join(", ");

		if (!words) return null;
		return {
			guildId: message.guild.id,
			moderator: this.client.user.id,
			reason: `Automatic warning carried out for using blacklisted word(s) (${
				words.length > 50 ? words.substr(0, 50 - 3) + "..." : words
			})`,
			userId: message.author.id,
			type: "blacklisted",
			date: Date.now(),
		};
	}
}
