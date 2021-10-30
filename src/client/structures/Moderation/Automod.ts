import { readFile } from "fs/promises";
import { CheckResults, ModerationSettings, GuildMessage, ThresholdsSetting } from "./interfaces";
import Client from "../../Client";
import { join } from "path";
import { Invite, Message } from "discord.js";
import ms from "ms";
import { ModerationMessage } from "./ModerationMessage";
import { BadWordsSettings } from ".";
import { Timeout, setTimeout as setLongTimeout } from "long-timeout";
import moment from "moment";

interface Filter {
	count: number;
	lastMessage: Message;
	timer: NodeJS.Timeout;
}

interface ModTimeout {
	caseId: number;
	timeout: Timeout;
}

export class Automod {
	public settings!: ModerationSettings;

	public spamfilter: Map<string, Filter> = new Map();
	public mentionfilter: Map<string, Filter> = new Map();

	public modTimeouts: Map<string, ModTimeout> = new Map();

	constructor(public client: Client) {
		this.loadSettings();
	}

	public async loadSettings(): Promise<void> {
		const data = await readFile(join(process.cwd(), "config", "automod.json"), "utf-8");
		this.settings = JSON.parse(data);
	}

	protected bypass(message: Message, setting: ThresholdsSetting | BadWordsSettings): boolean {
		if (
			!message.member ||
			message.member.permissions.has("MANAGE_GUILD") ||
			message.guildId !== this.client.constants.guild
		)
			return true;

		const roles = setting.whitelisted
			.filter((str) => str.toLowerCase().includes("role-"))
			.map((str) => str.slice(5));
		if (message.member.roles.cache.some((r) => roles.includes(r.id))) return true;

		if (
			!setting.enabled ||
			setting.whitelisted.includes(`CHANNEL-${message.channel.id}`) ||
			setting.whitelisted.includes(`USER-${message.author.id}`)
		)
			return true;

		return false;
	}

	protected replace(str: string, vars: Record<string, string>): string {
		for (const key of Object.keys(vars)) str = str.replace(new RegExp(`{${key}}`, "g"), vars[key]);

		return str;
	}

	public async run(message: Message): Promise<void> {
		const msg = message as GuildMessage;
		const results = await Promise.all([
			this.caps(msg),
			this.inviteLinks(msg),
			this.spam(msg),
			this.mention(msg),
			this.badWords(msg),
		]);
		const filtered = results.filter((result) => !!result) as CheckResults[];

		filtered.forEach(async (result) => {
			const setting = (
				this.settings.thresholds as Record<string, ThresholdsSetting | BadWordsSettings>
			)[result.type];
			switch (setting?.type) {
				case "verbal":
					await message
						.reply({ content: result.message, allowedMentions: { repliedUser: true } })
						.catch(() => void 0);
					break;
				case "warn":
					{
						await message.delete().catch(() => void 0);
						await message.channel
							.send({ content: result.message, allowedMentions: { users: [result.user] } })
							.catch(() => void 0);

						const warn = await this.client.prisma.modlog.create({
							data: {
								reason: result.reason,
								id: `${result.user}-${result.guild}`,
								moderator: this.client.user?.id ?? "",
								startDate: new Date(result.date),
								type: "warn",
							},
						});

						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const user = this.client.user!;
						const log = ModerationMessage.logs(
							result.reason,
							"warn",
							message.author,
							user,
							`CaseId: ${warn.caseId}`,
							result.date
						);

						this.client.loggingHandler.sendLogs(log, "mod");

						const embed = ModerationMessage.dm(
							result.reason,
							"warn",
							message.author,
							`CaseId: ${warn.caseId}`,
							result.date
						);
						await message.author.send({ embeds: [embed] }).catch(() => void 0);
					}
					break;
				case "mute":
					{
						await message.delete().catch(() => void 0);
						await message.channel
							.send({ content: result.message, allowedMentions: { users: [result.user] } })
							.catch(() => void 0);

						const id = `${result.user}-${result.guild}`;
						const mute = await this.client.prisma.modlog.create({
							data: {
								reason: result.reason,
								id,
								moderator: this.client.user?.id ?? "",
								startDate: new Date(result.date),
								endDate: new Date(result.date + this.settings.mute.duration),
								type: "mute",
								timeoutFinished: false,
							},
						});

						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const user = this.client.user!;
						const log = ModerationMessage.logs(
							result.reason,
							"mute",
							message.author,
							user,
							`CaseId: ${mute.caseId}`,
							result.date,
							this.settings.mute.duration
						);

						this.client.loggingHandler.sendLogs(log, "mod");

						const timeout = setLongTimeout(async () => {
							const unmuteReason = `Automatic unmute from mute made by ${this.client.user?.toString()} <t:${moment(
								result.date
							).unix()}:R>`;

							const finishLogs = ModerationMessage.logs(
								unmuteReason,
								"unmute",
								message.author,
								user,
								`CaseId: ${mute.caseId}`,
								result.date,
								this.settings.mute.duration
							);

							await message.member?.roles.remove(this.settings.mute.role).catch(() => void 0);
							await this.client.prisma.modlog.update({
								where: { caseId: mute.caseId },
								data: { timeoutFinished: true },
							});
							this.client.loggingHandler.sendLogs(finishLogs, "mod");
						}, this.settings.mute.duration);

						this.modTimeouts.set(`${id}-mute`, {
							timeout,
							caseId: mute.caseId,
						});

						const embed = ModerationMessage.dm(
							result.reason,
							"mute",
							message.author,
							`CaseId: ${mute.caseId}`,
							result.date,
							this.settings.mute.duration
						);
						await message.author.send({ embeds: [embed] }).catch(() => void 0);
					}
					break;
			}
		});
	}

	protected caps(message: GuildMessage): CheckResults | null {
		const { caps } = this.settings.thresholds;
		if (this.bypass(message, caps)) return null;

		const arr = message.content
			.trim()
			.toLowerCase()
			.split("")
			.filter((c) => c.match(/[a-z]/g));

		if (arr.length <= 10) return null;
		if (message.content === message.content.toUpperCase())
			return {
				guild: message.guild.id,
				reason: caps.reason,
				message: caps.message,
				user: message.author.id,
				date: Date.now(),
				type: "caps",
			};

		const res = arr
			.map((str): number => (str === str.toUpperCase() ? 1 : 0))
			.reduce((a, b) => a + b);

		if (arr.length * caps.threshold.value <= res)
			return {
				guild: message.guild.id,
				reason: caps.reason,
				message: caps.message,
				user: message.author.id,
				date: Date.now(),
				type: "caps",
			};

		return null;
	}

	protected spam(message: GuildMessage): CheckResults | null {
		const { spam } = this.settings.thresholds;
		if (this.bypass(message, spam)) return null;

		if (this.spamfilter.has(`${message.author.id}-${message.guild.id}`)) {
			const { lastMessage, timer, count } = this.spamfilter.get(
				`${message.author.id}-${message.guild.id}`
			) as Filter;
			const difference = message.createdTimestamp - lastMessage.createdTimestamp;
			let messageCount: number = count;

			if (difference > 25e2) {
				clearTimeout(timer);
				this.spamfilter.set(`${message.author.id}-${message.guild.id}`, {
					count: 1,
					lastMessage: message,
					timer: setTimeout(
						() => this.spamfilter.delete(`${message.author.id}-${message.guild.id}`),
						spam.threshold.duration
					),
				});
			} else {
				++messageCount;
				if (messageCount >= spam.threshold.value) {
					this.spamfilter.set(`${message.author.id}-${message.guild.id}`, {
						lastMessage: message,
						count: 1,
						timer,
					});
					return {
						guild: message.guildId,
						reason: this.replace(spam.reason, {
							messages: spam.threshold.value.toString(),
							duration: ms(spam.threshold.duration),
						}),
						message: this.replace(spam.message, { user: message.member.toString() }),
						user: message.author.id,
						date: Date.now(),
						type: "spam",
					};
				} else {
					this.spamfilter.set(`${message.author.id}-${message.guild.id}`, {
						lastMessage: message,
						count: messageCount,
						timer,
					});
				}
			}
		} else {
			const fn = setTimeout(
				() => this.spamfilter.delete(`${message.author.id}-${message.guild.id}`),
				spam.threshold.duration
			);

			this.spamfilter.set(`${message.author.id}-${message.guild.id}`, {
				count: 1,
				lastMessage: message,
				timer: fn,
			});
		}

		return null;
	}

	protected mention(message: GuildMessage): CheckResults | null {
		const { mention } = this.settings.thresholds;
		if (this.bypass(message, mention)) return null;

		if (this.mentionfilter.has(`${message.author.id}-${message.guild.id}`)) {
			const { lastMessage, timer, count } = this.mentionfilter.get(
				`${message.author.id}-${message.guild.id}`
			) as Filter;
			const difference = message.createdTimestamp - lastMessage.createdTimestamp;
			let mentionCount: number = count;

			if (difference > 25e2) {
				clearTimeout(timer);
				this.mentionfilter.set(`${message.author.id}-${message.guild.id}`, {
					count: 1,
					lastMessage: message,
					timer: setTimeout(
						() => this.mentionfilter.delete(`${message.author.id}-${message.guild.id}`),
						mention.threshold.duration
					),
				});
			} else {
				mentionCount +=
					message.mentions.members?.filter((m) => !m.user.bot && m.id !== message.author.id).size ??
					0;

				if (mentionCount >= mention.threshold.value) {
					this.mentionfilter.set(`${message.author.id}-${message.guild.id}`, {
						lastMessage: message,
						count: 1,
						timer,
					});
					return {
						guild: message.guildId,
						reason: this.replace(mention.reason, {
							count: mentionCount.toString(),
							limit: mention.threshold.value.toString(),
							duration: ms(mention.threshold.duration),
						}),
						message: this.replace(mention.message, { user: message.member.toString() }),
						user: message.author.id,
						date: Date.now(),
						type: "mention",
					};
				} else {
					this.mentionfilter.set(`${message.author.id}-${message.guild.id}`, {
						lastMessage: message,
						count: mentionCount,
						timer,
					});
				}
			}
		} else {
			const fn = setTimeout(
				() => this.mentionfilter.delete(`${message.author.id}-${message.guild.id}`),
				mention.threshold.duration
			);

			this.mentionfilter.set(`${message.author.id}-${message.guild.id}`, {
				count:
					message.mentions.members?.filter((m) => !m.user.bot && m.id !== message.author.id).size ??
					0,
				lastMessage: message,
				timer: fn,
			});
		}

		return null;
	}

	protected async inviteLinks(message: GuildMessage): Promise<CheckResults | null> {
		const { invite: InviteSettings } = this.settings.thresholds;
		if (this.bypass(message, InviteSettings)) return null;

		const regex = /discord(?:(?:app)?\.com\/invite|\.gg(?:\/invite)?)\/([\w-]{2,255})/gi;
		const invites = message.content.match(regex) ?? [];

		let invite: Invite | null = null;
		for await (const inviteLink of invites) {
			invite = await this.client.fetchInvite(inviteLink).catch(() => null);
			if (invite) break;
		}

		if (!invite) return null;

		return {
			guild: message.guildId,
			reason: this.replace(InviteSettings.reason, {
				channel: message.channel.toString(),
				name: (invite.guild?.name || invite.channel.name) ?? "unknown name",
				code: invite.code,
			}),
			message: this.replace(InviteSettings.message, { user: message.member.toString() }),
			user: message.author.id,
			date: Date.now(),
			type: "invite",
		};
	}

	protected badWords(message: GuildMessage): CheckResults | null {
		const { badWords } = this.settings.thresholds;
		if (this.bypass(message, badWords)) return null;

		const words = message.content
			.toLowerCase()
			.replace(/\|/g, "")
			.split(/\s+/)
			.map((word) =>
				badWords.blacklistedWords.some((str) => word.includes(str.toLowerCase())) &&
				!badWords.whitelistedWords.some((str) => word.includes(str.toLowerCase()))
					? word
					: null
			)
			.filter((w) => w !== null)
			.join(", ");

		if (!words) return null;

		return {
			guild: message.guildId,
			reason: this.replace(badWords.reason, {
				words,
			}),
			message: this.replace(badWords.message, { user: message.member.toString() }),
			user: message.author.id,
			date: Date.now(),
			type: "badWords",
		};
	}
}
