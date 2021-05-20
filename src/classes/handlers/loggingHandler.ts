import {
	Message,
	WebhookClient,
	MessageEmbed,
	NewsChannel,
	TextChannel,
	Collection,
	Guild,
	User,
} from "discord.js";
import ms from "ms";
import modtechClient from "../../client/client";
import { iLogs, iWarn } from "../../models/interfaces";

interface iMessages {
	message: MessageEmbed[];
	mod: MessageEmbed[];
	guild: Guild;
}

export default class LoggingHandler {
	constructor(public client: modtechClient) {}
	public messages = new Collection<string, iMessages>();
	public timeouts = new Collection<string, NodeJS.Timeout>();

	public messageUpdate(oldMessage: Message, newMessage: Message): void {
		newMessage.channel = newMessage.channel as TextChannel | NewsChannel;
		const collection = this.messages.get(newMessage.guild.id) || {
			guild: newMessage.guild,
			message: [],
			mod: [],
		};

		collection.message.push(
			new MessageEmbed()
				.setColor("#4a7cc5")
				.setTitle(`Message edited in #${newMessage.channel.name}`)
				.setDescription(`[Jump to message](${newMessage.url})`)
				.setFooter(
					`${newMessage.author.tag} - ${newMessage.author.id}`,
					newMessage.author.displayAvatarURL({ dynamic: true, size: 4096 })
				)
				.setTimestamp()
				.addFields([
					{
						name: "• Before",
						value: oldMessage.content.substr(0, 1024),
					},
					{
						name: "• After",
						value: newMessage.content.substr(0, 1024),
					},
				])
		);

		this.setTimeout(collection);
	}

	public messageDelete(message: Message): void {
		message.channel = message.channel as TextChannel | NewsChannel;
		const collection = this.messages.get(message.guild.id) || {
			guild: message.guild,
			message: [],
			mod: [],
		};

		collection.message.push(
			new MessageEmbed()
				.setColor("#c04e3f")
				.setTitle(`Message deleted in #${message.channel.name}`)
				.setDescription(message.content)
				.setTimestamp()
				.setFooter(
					`${message.author.tag} - ${message.author.id}`,
					message.author.displayAvatarURL({ dynamic: true, size: 4096 })
				)
		);

		this.setTimeout(collection);
	}

	public messageDeleteBulk(messages: Collection<string, Message>, size: number): void {
		const message = messages.first();
		message.channel = message.channel as TextChannel | NewsChannel;

		const content = messages
			.map((m) => `[${m.author.toString()}]: ${m.content.replace("{\\N}", "")}{\\N}`)
			.join("")
			.match(/.{0,2048}/g)
			.filter((str) => str.length > 0);

		const collection = this.messages.get(message.guild.id) || {
			guild: message.guild,
			message: [],
			mod: [],
		};

		let i: number = 0;
		for (const c of content) {
			const embed = new MessageEmbed();

			if (i === 0 && content.length === 1) {
				embed
					.setTimestamp()
					.setColor("#DC5E55")
					.setFooter(`${messages.size} of ${size} messages shown`)
					.setTitle(`Messages deleted in #${message.channel.name}`)
					.setDescription(c.replace(/{\\N}/g, "\n"));
			} else if (i === 0) {
				embed
					.setColor("#DC5E55")
					.setTitle(`Messages deleted in #${message.channel.name}`)
					.setDescription(c.replace(/{\\N}/g, "\n"));
			} else if (i + 1 === content.length) {
				embed
					.setTimestamp()
					.setColor("#DC5E55")
					.setFooter(`${messages.size} of ${size} messages shown`)
					.setDescription(c.replace(/{\\N}/g, "\n"));
			} else {
				embed.setColor("#DC5E55").setDescription(c.replace(/{\\N}/g, "\n"));
			}

			i += 1;
			collection.message.push(embed);
		}
		this.setTimeout(collection);
	}

	public async warn(message: Message, moderator: User, data: iWarn) {
		const collection = this.messages.get(data.guildId) || {
			guild: message.guild,
			message: [],
			mod: [],
		};

		const user = await this.client.utils.fetchUser(data.userId);
		collection.mod.push(
			new MessageEmbed()
				.setColor("#ffeb00")
				.setTitle(`User warned ${data.caseId}`)
				.setDescription([
					`Warned by **${moderator.tag}** (${moderator.toString()})`,
					`Reason: **${data.reason.substr(0, 1900)}**`,
				])
				.setTimestamp()
				.setFooter(`${user.tag} - ${user.id}`, user.displayAvatarURL({ dynamic: true, size: 4096 }))
		);

		this.setTimeout(collection);
	}

	public async mute(message: Message, moderator: User, data: iLogs) {
		const collection = this.messages.get(data.guildId) || {
			guild: message.guild,
			message: [],
			mod: [],
		};

		const user = await this.client.utils.fetchUser(data.userId);
		collection.mod.push(
			new MessageEmbed()
				.setColor("#ffa300")
				.setTitle(`User muted`)
				.setDescription([
					`Muted by **${moderator.tag}** (${moderator.toString()})`,
					`Duration: \`${ms(data.endDate - data.startDate || 0, { long: true })}\``,
					`Reason: **${data.reason.substr(0, 1900)}**`,
				])
				.setTimestamp()
				.setFooter(`${user.tag} - ${user.id}`, user.displayAvatarURL({ dynamic: true, size: 4096 }))
		);

		this.setTimeout(collection);
	}

	public unmute(user: User, moderator: User, data: iLogs) {
		const guild = this.client.guilds.cache.get(data.guildId);
		if (!guild) return;

		const collection = this.messages.get(data.guildId) || {
			guild,
			message: [],
			mod: [],
		};

		collection.mod.push(
			new MessageEmbed()
				.setColor("#9fff72")
				.setTitle(`User ${data.type === "mute" ? "unmuted" : "unbanned"}`)
				.setDescription([
					`Unmuted by **${moderator.tag}** (${moderator.toString()})`,
					`Reason: **${data.reason.substr(0, 1900)}**`,
				])
				.setTimestamp()
				.setFooter(`${user.tag} - ${user.id}`, user.displayAvatarURL({ dynamic: true, size: 4096 }))
		);

		this.setTimeout(collection);
	}

	public unban(data: any) {
		const collection = this.messages.get(data.guild.id) || {
			guild: data.guild,
			message: [],
			mod: [],
		};

		collection.mod.push(
			new MessageEmbed()
				.setColor("#9fff72")
				.setTitle(`User unbanned from the server`)
				.setDescription([
					`Unbanned by **${data.moderator.tag}** (${data.moderator.toString()})`,
					`Reason: **${data.reason.substr(0, 1500)}**`,
				])
				.setTimestamp()
				.setFooter(
					`${data.user.tag} - ${data.user.id}`,
					data.user.displayAvatarURL({ dynamic: true, size: 4096 })
				)
		);

		this.setTimeout(collection);
	}

	public async kick(user: User, moderator: User, data: iLogs) {
		const guild = this.client.guilds.cache.get(data.guildId);
		if (!guild) return;

		const collection = this.messages.get(data.guildId) || {
			guild,
			message: [],
			mod: [],
		};

		collection.mod.push(
			new MessageEmbed()
				.setColor("#ff5243")
				.setTitle(`User kicked`)
				.setDescription([
					`Kicked by **${moderator.tag}** (${moderator.toString()})`,
					`Reason: **${data.reason.substr(0, 1900)}**`,
				])
				.setTimestamp()
				.setFooter(`${user.tag} - ${user.id}`, user.displayAvatarURL({ dynamic: true, size: 4096 }))
		);

		this.setTimeout(collection);
	}

	public ban(data: any) {
		const collection = this.messages.get(data.guild.id) || {
			guild: data.guild,
			message: [],
			mod: [],
		};

		collection.mod.push(
			new MessageEmbed()
				.setColor("#000000")
				.setTitle(`User banned from the server`)
				.setDescription([
					`Banned by **${data.moderator.tag}** (${data.moderator.toString()})${
						data.endDate
							? `\nDuration: \`${ms(data.endDate - data.startDate || 0, { long: true })}\``
							: ""
					}`,
					`Reason: **${data.reason.substr(0, 1500)}**`,
				])
				.setTimestamp()
				.setFooter(
					`${data.user.tag} - ${data.user.id}`,
					data.user.displayAvatarURL({ dynamic: true, size: 4096 })
				)
		);

		this.setTimeout(collection);
	}

	private setTimeout(collection: iMessages) {
		this.messages.set(collection.guild.id, collection);
		if (!this.timeouts.has(collection.guild.id)) {
			const timeout = setTimeout(() => this.sendRequest(collection.guild.id), 1e3);
			this.timeouts.set(collection.guild.id, timeout);
		}
	}

	private async sendRequest(guildId: string) {
		const { message, mod, guild } = this.messages.get(guildId);
		const { config } = guild;

		this.messages.delete(guild.id);
		this.timeouts.delete(guild.id);

		try {
			const chunkSize = 10;
			const groups = message
				.map((_, i) => (i % chunkSize === 0 ? message.slice(i, i + chunkSize) : null))
				.filter((e) => e);

			let embeds: MessageEmbed[][] = [];
			groups.forEach((g) => {
				let count = 0;
				let arr: MessageEmbed[] = [];

				g.forEach((m) => {
					count += m.length;
					if (count >= 6e3) {
						embeds.push(arr);
						count = m.length;
						arr = [m];
					} else arr.push(m);
				});
				embeds.push(arr);
			});

			const { id, token } = this.getCreds(config.messageLogging);
			if (id && token) {
				const webhook = new WebhookClient(id, token);
				await Promise.all(
					embeds.map(
						async (e) =>
							await webhook
								.send("", {
									avatarURL: this.client.user.displayAvatarURL({ size: 4096 }),
									embeds: e,
								})
								.catch((e) => console.log(e))
					)
				);
			}
		} catch (e) {}

		try {
			const chunkSize = 10;
			const groups = mod
				.map((_, i) => (i % chunkSize === 0 ? mod.slice(i, i + chunkSize) : null))
				.filter((e) => e);

			let embeds: MessageEmbed[][] = [];
			groups.forEach((g) => {
				let count = 0;
				let arr: MessageEmbed[] = [];

				g.forEach((m) => {
					count += m.length;
					if (count >= 6e3) {
						embeds.push(arr);
						count = m.length;
						arr = [m];
					} else arr.push(m);
				});
				embeds.push(arr);
			});

			const { id, token } = this.getCreds(config.modLogging);
			if (id && token) {
				const webhook = new WebhookClient(id, token);
				await Promise.all(
					embeds.map(
						async (e) =>
							await webhook
								.send("", {
									avatarURL: this.client.user.displayAvatarURL({ size: 4096 }),
									embeds: e,
								})
								.catch((e) => console.log(e))
					)
				);
			}
		} catch (e) {}
	}

	public getCreds(url: string): { id: string; token: string } {
		const [, id, token] =
			typeof url === "string"
				? url.match(/^https:\/\/discord(?:app)?\.com\/api\/webhooks\/([^\/]+)\/([^\/]+)/)
				: [];
		return { id, token };
	}
}
