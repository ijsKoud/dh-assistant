import ms from "ms";
import { GuildMember } from "discord.js";
import { Message } from "discord.js";
import dhClient from "../client/client";
import { iWarn } from "../model/interfaces";
import Warn from "../model/moderation/Warn";
import Mute from "../model/moderation/Mute";

const spamfilter: Map<string, sFilterObj> = new Map();
interface sFilterObj {
	msgCount: number;
	lastMessage: Message;
	timer: NodeJS.Timeout;
}

const mentionFilter: Map<string, mFilterObj> = new Map();
interface mFilterObj {
	mCount: number;
	lastMessage: Message;
	timer: NodeJS.Timeout;
}

interface warnObj {
	guildId: string;
	type: "spam" | "blacklisted" | "mention" | "capabuse";
	moderator: string;
	userId: string;
	reason: string;
}

export default class Automod {
	constructor(public client: dhClient) {}

	public check(message: Message): warnObj[] {
		if (!this.client.mod.automod) return [];
		return [
			this.spamFilter(message),
			this.mentionFilter(message),
			this.caps(message),
			this.blacklisted(message),
		].filter((o) => o !== null);
	}

	public async warn(
		offender: GuildMember,
		moderator: GuildMember,
		reason: string
	): Promise<string> {
		const warns = await Warn.find({ guildId: offender.guild.id });
		const latest: iWarn = warns?.sort((a, b) => b.date - a.date)?.[0] || {
			caseId: "#0",
			date: 0,
			moderator: "0",
			guildId: offender.guild.id,
			userId: "0",
			reason: "",
		};

		const caseId = `#${parseInt(latest.caseId.slice(1)) + 1}`;
		await Warn.create({
			guildId: offender.guild.id,
			date: Date.now(),
			moderator: moderator.id,
			userId: offender.id,
			reason,
			caseId,
		});

		this.client.emit("warnEvent", offender, moderator, reason, caseId);
		const warnCount = warns.filter((w) => w.userId === offender.id)?.length || 0;
		if (warnCount % 2 === 0) {
			await offender
				.send(
					this.client.tagscript(
						this.client.messages.DM + "\n\n⌚ | **Duration of mute**: `{DURATION}`",
						{
							TYPE: "Mute",
							GUILD: offender.guild.name,
							reason: reason.substr(0, 1900),
							DURATION: ms(6e5),
						}
					)
				)
				.catch((e) => null);

			await Mute.create({
				guildId: offender.guild.id,
				userId: offender.id,
				moderator: moderator.id,
				date: Date.now() + 6e5,
				duration: 6e5,
			});

			await offender.roles.add(this.client.config.muteRole, `${reason}`);
			this.client.emit("muteEvent", offender, offender.guild.me, reason, 6e5);
		}
		return caseId;
	}

	private spamFilter(message: Message): warnObj {
		if (spamfilter.has(message.author.id)) {
			const { lastMessage, timer, msgCount } = spamfilter.get(message.author.id);
			const difference = message.createdTimestamp - lastMessage.createdTimestamp;
			let messageCount: number = msgCount;

			if (difference > 2500) {
				clearTimeout(timer);
				spamfilter.set(message.author.id, {
					msgCount: 1,
					lastMessage: message,
					timer: setTimeout(() => spamfilter.delete(message.author.id), 5e3),
				});
			} else {
				++messageCount;
				if (messageCount === 7) {
					spamfilter.set(message.author.id, {
						lastMessage: message,
						msgCount: messageCount - 1,
						timer,
					});
					return {
						guildId: message.guild.id,
						moderator: this.client.user.id,
						reason: "Automatic action carried out for hitting the message rate limit (7/5s)",
						userId: message.author.id,
						type: "spam",
					};
				} else {
					spamfilter.set(message.author.id, {
						lastMessage: message,
						msgCount: messageCount,
						timer,
					});
				}
			}
		} else {
			let fn = setTimeout(() => spamfilter.delete(message.author.id), 5e3);
			spamfilter.set(message.author.id, {
				msgCount: 1,
				lastMessage: message,
				timer: fn,
			});
		}

		return null;
	}

	private mentionFilter(message: Message): warnObj {
		if (mentionFilter.has(message.author.id)) {
			const { lastMessage, timer, mCount } = mentionFilter.get(message.author.id);
			const difference = message.createdTimestamp - lastMessage.createdTimestamp;
			let mentionCount: number = mCount;

			if (difference > 2500) {
				clearTimeout(timer);
				mentionFilter.set(message.author.id, {
					mCount: 1,
					lastMessage: message,
					timer: setTimeout(() => mentionFilter.delete(message.author.id), 5e3),
				});
			} else {
				mentionCount += message.mentions.members?.filter((m) => !m.user.bot)?.size || 0;
				if (mentionCount >= 7) {
					mentionFilter.set(message.author.id, {
						lastMessage: message,
						mCount: 1,
						timer,
					});
					return {
						guildId: message.guild.id,
						moderator: this.client.user.id,
						reason: "Automatic action carried out for mass mentioning users in the server (7/5s)",
						userId: message.author.id,
						type: "mention",
					};
				} else {
					mentionFilter.set(message.author.id, {
						lastMessage: message,
						mCount: mentionCount,
						timer,
					});
				}
			}
		} else {
			let fn = setTimeout(() => mentionFilter.delete(message.author.id), 5e3);
			mentionFilter.set(message.author.id, {
				mCount: 1,
				lastMessage: message,
				timer: fn,
			});
		}

		return null;
	}

	private caps(message: Message): warnObj {
		let uppercase: number = 0;
		const char = message.content
			.trim()
			.toLowerCase()
			.split("")
			.filter((c) => c.match(/[a-z]/gm));
		if (char.length <= 10) return null;
		if (message.content === message.content.toUpperCase())
			return {
				guildId: message.guild.id,
				moderator: this.client.user.id,
				reason: "Too many caps!",
				userId: message.author.id,
				type: "capabuse",
			};

		char.forEach((str) => (uppercase += str === str.toUpperCase() && isNaN(Number(str)) ? 1 : 0));

		if ((char.length / 100) * 75 <= uppercase)
			return {
				guildId: message.guild.id,
				moderator: this.client.user.id,
				reason: "Too many caps!",
				userId: message.author.id,
				type: "capabuse",
			};
		return null;
	}

	private blacklisted(message: Message): warnObj {
		let blWord: string = null;
		message.content
			.toLowerCase()
			.replace(/\|/g, "")
			.split(/\s+/)
			.forEach((word) =>
				this.client.config.blacklisted.forEach((w) => (blWord = word.match(w)?.shift() || blWord))
			);

		if (!blWord) return null;
		return {
			guildId: message.guild.id,
			moderator: this.client.user.id,
			reason: `Automatic warning carried out for using blacklisted word (${
				blWord.length > 50 ? blWord.substr(0, 50 - 3) + "..." : blWord
			})`,
			userId: message.author.id,
			type: "blacklisted",
		};
	}
}
