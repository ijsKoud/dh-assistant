import moment from "moment";
import {
	ignoreBlacklistWord,
	modlog,
	seniorTeam,
	ticketCategory,
	ticketClaim,
	videoSuggestions,
} from "./../../client/config";
import { Listener } from "discord-akairo";
import { Message, GuildMember, Collection, MessageReaction, User } from "discord.js";
import ticket from "../../models/tickets";
import warn from "../../models/warn";
import { MessageEmbed } from "discord.js";
import { appendFile, writeFile } from "fs/promises";
import blacklist from "../../models/blacklist";

const BASE_MSG = ">>> 💬 | Reply from **{USER_NAME}**:```\n{CONTENT}\n```";
const tickets = new Map<string, boolean>();
const spamfilter: Map<string, filterObj> = new Map();
interface filterObj {
	msgCount: number;
	lastMessage: Message;
	timer: NodeJS.Timeout;
}

const blacklisted: string[] = [
	"fuck",
	"nigg",
	"fuk",
	"cunt",
	"cnut",
	"bitch",
	"dick",
	"d1ck",
	"pussy",
	"asshole",
	"b1tch",
	"b!tch",
	"blowjob",
	"c0ck",
	"ahole",
	"nigger",
	"nigga",
	"shitty",
	"shit",
	"shite",
	":middle_finger:",
	"🖕",
];

const whitelisted: string[] = [];

export default class message extends Listener {
	constructor() {
		super("message", {
			event: "message",
			category: "client",
			emitter: "client",
		});
	}

	async exec(message: Message) {
		if (message.author.bot || message.system || message.webhookID) return;
		if (message.mentions.users.has(this.client.user.id) && message.content.startsWith("<@"))
			return this.createticket(message);
		if (message.channel.type === "dm" || message.channel.name === "ticket")
			return this.ticketchat(message);
		if (message.channel.id === videoSuggestions) return this.videoSuggestions(message);

		// auto mod
		if (
			!this.client.automod ||
			!message.guild ||
			message.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true })
		)
			return;

		const filtered = this.filter(message.content.toLowerCase());
		// const capAbuse = this.caps(message.content);

		// if (capAbuse && message.content.length > 10)
		// 	return message.channel.send(`> ❗ | Hey, ${message.author.toString()}, too many caps!`);
		if (message.content.toLowerCase().includes("nigga")) {
			const reason = "Rasicm is strictly not allowed!";
			let DMed = true;
			await message.member
				.send(
					`>>> 👞 | **Kicked - Draavo's Hangout**\n📃 | Reason: **${reason}**\n\n👋 | **Want to join back?**\nMake sure to follow the rules and listen to the staff members! http://www.draavo.cf/discord`,
					{ split: true }
				)
				.catch((e) => (DMed = false));

			await message.member.kick(`${reason}`).catch((e) => {
				return message.channel.send(
					`>>> ${this.client.utils.emojiFinder(
						"warning"
					)} | Oops, Discord threw an exception: \`${e}\`.`
				);
			});

			const channel = await this.client.utils.getChannel(modlog);
			channel.send(
				new MessageEmbed()
					.setColor("#4C8CFB")
					.setAuthor(`👞 Kick | ${this.client.user.tag}`)
					.setDescription(`Responsable moderator: ${message.author.toString()}`)
					.addField("• Reason", reason.substr(0, 1024))
			);

			message.delete();
			return message.util.send(
				`>>> 👞 | Successfully kicked **${message.author.tag}** for **${reason}**. ${
					DMed ? "" : "\nℹ | **I couldn't DM this user**"
				}`,
				{ split: true }
			);
		}
		if (filtered && !ignoreBlacklistWord.includes(message.channel.id)) {
			(
				await message.channel.send(
					`>>> | ${message.author.toString()}, swearing is only allowed in <#723665469894164580>!`
				)
			).delete({ timeout: 5e3 });
			return (
				this.warn(
					message.content,
					`Automatic warning for using a blacklisted word (${filtered})`,
					message.member
				) && message.delete()
			);
		}
		if (message.mentions.members.filter((m) => m.id !== message.author.id).size > 5)
			return (
				this.warn(
					message.content,
					`Automatic action carried out for spamming mentions (${
						message.mentions.members.filter((m) => m.id !== message.author.id).size
					} mentions)`,
					message.member
				) &&
				message.delete() &&
				message.channel.send(
					`> 🔔 | ${message.author.toString()}, you aren't allowed to mass mention people. The limit is 5 per message!`
				)
			);

		if (!["794256807337263114", "710090914776743966"].includes(message.channel.id))
			this.spamFilter(message);
	}

	filter(str: string) {
		let blWord: string = null;

		str
			.replace(/\|/g, "")
			.split(/\s+/)
			.forEach((word) => blacklisted.forEach((w) => (blWord = word.includes(w) ? w : blWord)));

		return blWord;
	}
	async warn(str: string, reason: string, user: GuildMember) {
		const caseId = `#${(await warn.find({ guildId: user.guild.id })).length + 1}`;
		await new warn({
			id: user.id,
			guildId: user.guild.id,
			moderator: this.client.user.id,
			reason: reason,
			case: caseId,
			date: Date.now(),
		})
			.save()
			.catch((e) => this.client.log(e));

		user
			.send(
				`> 🧾 | **Automatic warn - Draavo's Hangout**
      > 📃 | Reason: **${reason}**\n\n> ❗ | **This is an automatic warning, the system may not be 100% correct. If I am wrong:** 
      Create a ticket with the topic: \`warn appeal - automatic warning\` and add \`${str}\` to the description.`,
				{ split: true }
			)
			.catch((e) => null);

		this.client.emit("warnEvent", user.user, this.client.user, caseId, reason);
	}

	async spamFilter(message: Message) {
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
					const reason = "Automatic action carried out for hitting the message rate limit (7/5s)";
					const caseId = `#${(await warn.find({ guildId: message.guild.id })).length + 1}`;
					await new warn({
						id: message.author.id,
						guildId: message.guild.id,
						moderator: this.client.user.id,
						reason: reason,
						case: caseId,
						date: Date.now(),
					})
						.save()
						.catch((e) => this.client.log(e));

					message.author
						.send(`> 🧾 | **Automatic warn - Draavo's Hangout**\n> 📃 | Reason: **${reason}**`, {
							split: true,
						})
						.catch((e) => null);

					this.client.emit("warnEvent", message.author, this.client.user, caseId, reason);

					message.channel.send(
						`>>> ❗ | ${message.author.toString()}, don't spam. You can only spam in <#710090914776743966>!`
					);
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
	}

	caps(content: string): boolean {
		let uppercase: number = 0;
		const char = content
			.trim()
			.split("")
			.filter((str) => /^[a-zA-Z]/.test(str));

		if (char.length <= 0) return false;
		if (content === content.toUpperCase()) return true;

		char.forEach((str) => (uppercase += str === str.toUpperCase() ? 1 : 0));

		if ((char.length / 100) * 75 <= uppercase) return true;
		return false;
	}

	// video suggestions
	async videoSuggestions(message: Message) {
		if (
			!message.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true }) &&
			!message.content.toLowerCase().startsWith("video suggestion:")
		) {
			message.delete();
			return message.channel
				.send(
					">>> ❗ | Video suggestions only! Add `video suggestion:` to the beginning of your message to suggest something"
				)
				.then((m) => m.delete({ timeout: 5e3 }));
		}

		if (!message.content.toLowerCase().startsWith("video suggestion:")) return;
		["🔼", "🔽"].forEach((e) => message.react(e));
	}

	// tickets
	async createticket(message: Message) {
		const filter = (m: Message) => {
			return m.author.id === message.author.id && m.content.length !== 0;
		};
		const emojiFilter = (r: MessageReaction, u: User) => {
			return !u.bot && ["greentick"].includes(r.emoji.name);
		};

		if (tickets.has(message.author.id) || (await ticket.findOne({ userId: message.author.id })))
			return;
		if (!this.client.tickets)
			return message.channel.send(
				">>> 🔒 | Sorry, tickets are currently closed. Please try again later!"
			);
		const DMs = await message.author.createDM();

		if (await blacklist.findOne({ userId: message.author.id })) return;

		let DMed: boolean = true;
		const msg = await DMs.send(
			">>> 👋 Hello! What is the reason behind your ticket today? Please provide as much detail as possible so that we can help you as best as we can!"
		).catch((e) => (DMed = false));
		if (!DMed)
			return message.channel.send(
				">>> ❗ | Your DMs aren't open, open them to create a ticket.\n🤔 | If you think I am wrong, ping **DaanGamesDG#7621** to ask for help."
			);

		const collector = await DMs.awaitMessages(filter, {
			max: 1,
			time: 6e4,
			errors: ["time"],
		}).catch((e) => new Collection<string, Message>());
		if (collector.size === 0)
			return (msg as Message).edit(
				`>>> ${this.client.utils.emojiFinder(
					"redtick"
				)} | This took longer than expected, the command is canceled now!`
			);

		const claimChannel = await this.client.utils.getChannel(ticketClaim);
		if (!claimChannel) return DMs.send(">>> ❗ | Unable to find the claiming channel.");

		const claimMsg = await claimChannel.send(
			new MessageEmbed()
				.setTitle(`New Ticket | ${message.author.tag}`)
				.addField("Topic", collector.first().content.substr(0, 1024))
				.setColor("#9298F4")
				.setDescription(
					`React with "${this.client.utils.emojiFinder("greentick")}" to claim this ticket`
				)
		);
		claimMsg.react(this.client.utils.emojiFinder("greentick"));

		DMs.send("> 🎫 | Your ticket has been created, a staff member will reach out to you shortly.");
		tickets.set(message.author.id, true);
		const reactionCollector = await claimMsg
			.awaitReactions(emojiFilter, { max: 1, time: 864e5, errors: ["time"] })
			.catch((e) => new Collection<string, MessageReaction>());

		if (reactionCollector.size === 0)
			return DMs.send(
				">>> 😢 | The staff team wasn't able to claim your ticket, please open a new one or reach out the a staff member directly."
			);
		const first = reactionCollector.first();
		const user = first.users.cache.find((u) => !u.bot && !u.system);

		await DMs.send(
			`>>> 👥 | Your ticket has been claimed by **${user.tag}**, you should receive a response shortly.`
		).catch((e) => (DMed = false));
		if (!DMed) return tickets.delete(message.author.id);
		claimMsg.delete();

		const ticketChannel = await claimChannel.guild.channels.create("ticket", {
			type: "text",
			parent: ticketCategory,
			permissionOverwrites: [
				{
					type: "role",
					id: claimChannel.guild.id,
					deny: ["VIEW_CHANNEL"],
				},
				{
					type: "role",
					id: seniorTeam,
					allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
				},
				{
					type: "member",
					id: user.id,
					allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
				},
				{
					type: "member",
					id: this.client.user.id,
					allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
				},
			],
		});

		await new ticket({
			userId: message.author.id,
			channelId: ticketChannel.id,
			claimerId: user.id,
		}).save();

		(
			await ticketChannel.send(
				new MessageEmbed()
					.setColor("#9295F8")
					.setTitle(`Ticket claimer: ${user.tag}`)
					.setDescription([`>>> 📋 | **Topic**: ${collector.first().content.substr(0, 2000)}`])
					.setFooter(`Ticket Owner: ${message.author.tag}`)
			)
		).pin();

		tickets.delete(message.author.id);

		await writeFile(
			`transcriptions/${message.author.id}-ticket.txt`,
			`Transcription - ${moment(Date.now()).format("MMMM Do YYYY hh:mm:ss")}`,
			"utf-8"
		).catch((e) => this.client.log(`⚠ | file create error: \`${e}\``));
	}

	// chat system
	async ticketchat(message: Message) {
		try {
			const files = this.client.utils.getAttachments(message.attachments);
			switch (message.channel.type) {
				case "dm":
					{
						if (message.content.startsWith(process.env.PREFIX)) return;
						const schema = await ticket.findOne({ userId: message.author.id });
						if (!schema) return;

						const channel = await this.client.utils.getChannel(schema.get("channelId"));
						if (!channel) return;

						channel.send(
							BASE_MSG.replace(/{USER_NAME}/g, message.author.tag).replace(
								/{CONTENT}/g,
								message.content
							),
							{ split: true, files }
						);

						message.react(this.client.utils.emojiFinder("greentick"));
						this.transcript(`[DM] - ${message.author.tag}: ${message.content}`, message.author.id);
					}
					break;
				case "text":
					{
						const schema = await ticket.findOne({ channelId: message.channel.id });
						if (!schema || schema.get("claimerId") !== message.author.id) return;

						const user = await this.client.utils.fetchUser(schema.get("userId"));
						if (!user) return;

						this.transcript(`[CHAT] - ${message.author.tag}: ${message.content}`, user.id);
						if (message.content.startsWith(process.env.PREFIX)) return;

						user.send(
							BASE_MSG.replace(/{USER_NAME}/g, message.author.tag).replace(
								/{CONTENT}/g,
								message.content
							),
							{ split: true, files }
						);

						message.react(this.client.utils.emojiFinder("greentick"));
					}
					break;
			}
		} catch (e) {}
	}

	async transcript(str: string, id: string): Promise<void> {
		await appendFile(`transcriptions/${id}-ticket.txt`, `\n${str}`, "utf-8").catch((e) => {
			this.client.log(`⚠ | Transcript Error: \`${e}\``);
		});
	}
}
