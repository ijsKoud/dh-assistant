import { NewsChannel, TextChannel, Collection, Message } from "discord.js";
import { writeFile, readFile } from "fs/promises";
import prClient from "../../client/client";
import { join } from "path";
import { JSDOM } from "jsdom";
import markdownParser from "./markdownParser";
import twemoji from "twemoji";

import moment from "moment";
import "moment-timezone";

// interfaces
const iDocument = new JSDOM().window.document;
interface iConfig {
	channel: TextChannel | NewsChannel;
	id: string;
}

export default class Transcript {
	public document: any;
	public dom: JSDOM;
	public markdownParser: markdownParser;

	constructor(public client: prClient, public config: iConfig) {
		this.markdownParser = new markdownParser(this.client);
	}

	public async create(outdir: string): Promise<boolean> {
		try {
			let coll = new Collection<string, Message>();
			let res = await this.config.channel.messages.fetch({ limit: 100 });
			coll = coll.concat(res);

			while (res.size === 100) {
				res = await this.config.channel.messages.fetch({ limit: 100, before: res.lastKey() });
				if (res) coll = coll.concat(res);
			}

			const data = await readFile(join(process.cwd(), "template.html"));
			this.dom = new JSDOM(
				`<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>${this.config.channel.guild.name} | ${
					this.config.channel.name
				}</title>\n<link rel="icon" type="image/png" href="${this.config.channel.guild.iconURL({
					size: 4096,
					dynamic: true,
				})}"/>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width" />\n\n${new JSDOM(
					data
				).serialize()}\n</head>\n<body></body>\n</html>`
			);
			const { document } = this.dom.window;
			const body = document.getElementsByTagName("body").item(0);
			body.appendChild(this.getGuildDiv(document));

			let messages: Message[][] = [];
			let group: Message[] = [];

			coll
				.array()
				.reverse()
				.forEach((msg) => {
					if (group.length && !this.joinable(msg, group[group.length - 1])) {
						messages.push(group);
						group = [msg];
					} else group.push(msg);
				});

			messages.push(group);

			const chatDiv = document.createElement("div");
			chatDiv.setAttribute("class", "chat");
			chatDiv.append(...messages.map((g) => this.getMessageGroup(document, g)));

			body.appendChild(chatDiv);
			body.appendChild(this.getFooter(document, coll.size));
			await writeFile(outdir, this.dom.serialize());
		} catch (e) {
			this.client.log("ERROR", `Transcript error: \`\`\`${e.stack || e.message}\`\`\``);
			return false;
		}

		return true;
	}

	private joinable(msg1: Message, msg2: Message): boolean {
		return (
			msg1.author.id === msg2.author.id &&
			msg1.type === "DEFAULT" &&
			msg2.type === "DEFAULT" &&
			msg1.createdTimestamp - msg2.createdTimestamp <= 42e4
		);
	}

	private getMessageGroup(document: typeof iDocument, messages: Message[]) {
		const message = messages[0];
		// main message group div
		const groupDiv = document.createElement("div");
		groupDiv.setAttribute("class", "chat__message-group");

		// avatar div
		const avatarDiv = this.getAvatar(
			document,
			message.system
				? "https://cdn.daangamesdg.wtf/discord/wumpus.png"
				: message.author.displayAvatarURL({ dynamic: true, size: 128 })
		);
		groupDiv.appendChild(avatarDiv);

		// main message group div
		const messagesDiv = document.createElement("div");
		messagesDiv.setAttribute("class", "chat__messages");

		// username
		const user = document.createElement("a");
		user.setAttribute("class", "chat__author-name");
		user.setAttribute("title", message.system ? "Wumpus" : message.author.tag);
		user.setAttribute("data-user-id", message.author.id);
		user.setAttribute(
			"href",
			message.system ? "https://discord.com/" : `https://discord.com/users/${message.author.id}`
		);
		user.setAttribute(
			"style",
			`color: ${message.system ? "#B6D0FC" : message.member?.displayHexColor || "#fff"}`
		);
		user.appendChild(
			document.createTextNode(
				message.system ? "Wumpus" : message.member?.nickname || message.author.username
			)
		);
		messagesDiv.append(user, document.createTextNode("\n"));

		// add bot/system tag
		if (message.author.bot || message.system) {
			const tag = document.createElement("span");
			tag.setAttribute("class", "chat__bot-tag");
			tag.appendChild(
				document.createTextNode(message.system ? "SYTEM" : message.author.bot ? "BOT" : "UNKOWN")
			);
			messagesDiv.append(tag, document.createTextNode("\n"));
		}

		// timestamp div
		const timestamp = document.createElement("span");
		timestamp.setAttribute("class", "chat__timestamp");
		timestamp.appendChild(
			document.createTextNode(moment(message.createdAt).tz("Europe/London").format("DD/MM/YYYY h:mm:ss a"))
		);
		messagesDiv.appendChild(timestamp);
		messages.map((m) => messagesDiv.appendChild(this.getMessage(document, m)));

		groupDiv.appendChild(messagesDiv);
		return groupDiv;
	}

	private getMessage(document: typeof iDocument, message: Message) {
		const div = document.createElement("div");
		div.setAttribute("class", "chat__message");
		div.setAttribute("id", `message-${message.id}`);
		div.setAttribute("data-message-id", message.id);

		if (message.system) message = this.parseMessage(message);
		div.appendChild(this.toHTML(document, message));
		if (message.editedTimestamp) {
			const edited = document.createElement("span");
			edited.setAttribute("class", "chat__edited-timestamp");
			edited.setAttribute("title", moment(message.editedAt).tz("Europe/London").format("DD/MM/YYYY h:mm:ss a"));
			edited.append("(edited)");
			div.appendChild(edited);
		}

		if (message.embeds?.length) div.append(...this.getEmbeds(document, message));
		if (message.attachments?.size) div.append(...this.getAttachments(document, message));
		if (message.reactions?.cache?.size) div.appendChild(this.getReactions(document, message));

		if (message.reference?.messageID) {
			const reference = document.createElement("span");
			reference.setAttribute("class", "chat__reference-link");
			reference.setAttribute("title", "Jump to message");
			reference.setAttribute("onClick", `messageJump(event, '${message.reference.messageID}')`);

			reference.append(`(${message.type === "DEFAULT" ? "Replied Message" : "Jump"})`);
			div.appendChild(reference);
		}
		if (message.pinned) {
			const reference = document.createElement("span");
			reference.setAttribute("class", "chat__reference");
			reference.setAttribute("title", "Pinned Message");

			reference.append("(pinned)");
			div.appendChild(reference);
		}

		return div;
	}

	private parseMessage(message: Message): Message {
		switch (message.type) {
			case "PINS_ADD":
				message.content = `Message from ${message.author.toString()} has been pinned.`;
				break;
			default:
				message.content = "System Message";
				break;
		}

		return message;
	}

	private getReactions(document: typeof iDocument, message: Message) {
		const emojis = message.reactions.cache.map(({ emoji, count }) => {
			return {
				emoji: emoji.name,
				url: emoji.url,
				count: count ?? 1,
			};
		});

		const div = document.createElement("div");
		div.setAttribute("class", "chat__reactions");

		div.append(
			...emojis.map((e) => {
				const reaction = document.createElement("div");
				reaction.setAttribute("class", "chat__reaction");

				const emoji = document.createElement("img");
				emoji.setAttribute("class", "emoji emoji--small");
				emoji.setAttribute("alt", e.emoji);
				emoji.setAttribute(
					"src",
					e.url
						? e.url
						: `${twemoji.base}/72x72/${twemoji.convert.toCodePoint(
								e.emoji.indexOf(String.fromCharCode(0x200d)) < 0
									? e.emoji.replace(/\uFE0F/g, "")
									: e.emoji
						  )}.png`
				);
				emoji.setAttribute("height", "17");

				const span = document.createElement("span");
				span.setAttribute("class", "chat__reaction-count");
				span.append(e.count.toString());

				reaction.append(emoji, span);
				return reaction;
			})
		);

		return div;
	}

	private getEmbeds(document: typeof iDocument, message: Message): any[] {
		const embeds: any[] = [];
		for (const embed of message.embeds) {
			if (["youtube", "twitch", "vimeo"].includes(embed.provider?.name?.toLowerCase?.()))
				embed.type = "rich";

			switch (embed.type) {
				case "image":
					{
						const a = document.createElement("a");
						a.setAttribute("href", embed.url);

						const img = document.createElement("img");
						img.setAttribute("class", "chat__attachment-thumbnail");
						img.setAttribute("alt", "Image Attachment");
						img.setAttribute("src", embed.url);
						a.appendChild(img);

						embeds.push(a);
					}
					break;
				case "video":
					{
						const video = document.createElement("video");
						video.setAttribute("class", "chat__attachment-thumbnail");
						video.setAttribute("controls", "");

						const source = document.createElement("source");
						source.setAttribute("src", embed.url);
						source.setAttribute("alt", "Video Attachment");

						video.appendChild(source);
						embeds.push(video);
					}
					break;
				default:
					embeds.push(...this.markdownParser.parseEmbed(document, message, [embed]));
					break;
			}
		}

		return embeds;
	}

	private toHTML(document: typeof iDocument, message: Message) {
		const contentDiv = document.createElement("div");
		contentDiv.setAttribute("class", "chat__content");

		const mdDiv = document.createElement("div");
		mdDiv.setAttribute("class", "markdown");

		const mainSpan = document.createElement("span");
		mainSpan.setAttribute("class", "preserve-whitespace");

		const element = this.markdownParser.parseContent(message);
		mainSpan.appendChild(element);
		mdDiv.appendChild(mainSpan);
		contentDiv.appendChild(mdDiv);
		return contentDiv;
	}

	private getAttachments(document: typeof iDocument, message: Message) {
		const urls = this.client.utils.getAttachments(message.attachments);
		if (!urls.length) return [];

		return urls.map((url) => {
			const attachmentDiv = document.createElement("div");
			attachmentDiv.setAttribute("class", "chat__attachment");

			const onClickDiv = document.createElement("div");

			const div = document.createElement("div");

			const imgRegex = /^.*(jpg|png|gif|webp|tiff|psd|raw|bmp|heif|indd)$/g;
			const videoRegex = /^.*(webm|mpg|mp2|mpeg|mpe|mpv|ogg|mp4|m4p|m4v|avi|wmv|mov|qt|flv|swf|avchd)$/g;
			const audioRegex = /^.*(pcm|wav|aiff|mp3|acc|ogg|wma|flac|alac)$/g;

			const attachment = message.attachments.find((a) => url === a.url);

			if (imgRegex.test(url)) {
				const a = document.createElement("a");
				a.setAttribute("href", url);

				const img = document.createElement("img");
				img.setAttribute("class", `chat__attachment-thumbnail`);
				img.setAttribute("alt", "Image Attachment");
				img.setAttribute("style", "cursor: pointer;");

				if (attachment.height > 300) img.setAttribute("height", "300");

				img.setAttribute("src", url);
				img.setAttribute(
					"title",
					`${attachment.name} (${this.client.utils.formatBytes(attachment.size)})`
				);
				a.appendChild(img);

				div.appendChild(a);
			} else if (videoRegex.test(url)) {
				const video = document.createElement("video");
				video.setAttribute("class", "chat__attachment-thumbnail");
				video.setAttribute("controls", "");

				const source = document.createElement("source");
				source.setAttribute("src", url);
				source.setAttribute("alt", "Video Attachment");

				video.appendChild(source);
				div.appendChild(video);
			} else if (audioRegex.test(url)) {
				const audio = document.createElement("audio");
				audio.setAttribute("class", "chat__attachment-thumbnail");
				audio.setAttribute("controls", "");

				const source = document.createElement("source");
				source.setAttribute("src", url);
				source.setAttribute("alt", "Audio Attachment");

				audio.appendChild(source);
				div.appendChild(audio);
			} else {
				const container = document.createElement("div");
				container.setAttribute("class", "chat__attachment-container");

				const file = document.createElement("div");
				file.setAttribute("class", "chat__attachment-filename");

				const a = document.createElement("a");
				a.setAttribute("href", url);
				a.setAttribute("class", "chat__attachment-link");
				a.appendChild(document.createTextNode(attachment.name));
				file.appendChild(a);

				const size = document.createElement("div");
				size.setAttribute("class", "chat__attachment-filesize");
				size.appendChild(document.createTextNode(this.client.utils.formatBytes(attachment.size)));

				container.append(file, size);
				div.appendChild(container);
			}

			onClickDiv.appendChild(div);
			attachmentDiv.appendChild(onClickDiv);
			return attachmentDiv;
		});
	}

	private getAvatar(document: typeof iDocument, imgUrl: string) {
		const a = document.createElement("a");
		a.setAttribute("class", "chat__author-avatar-container");
		a.setAttribute("href", imgUrl);

		// image
		const img = document.createElement("img");
		img.setAttribute("class", "chat__author-avatar");
		img.setAttribute("src", imgUrl);
		img.setAttribute("alt", "avatar");
		img.setAttribute("style", "cursor: pointer;");

		a.appendChild(img);
		return a;
	}

	private getGuildDiv(document: typeof iDocument) {
		// guild div
		const guildDiv = document.createElement("div");
		guildDiv.setAttribute("class", "top");

		// guild icon div
		let divContainer = document.createElement("div");
		const guildImg = document.createElement("img");
		divContainer.setAttribute("class", "top__guild-icon-container");
		guildImg.setAttribute("class", "top__guild-icon");
		guildImg.setAttribute("src", this.config.channel.guild.iconURL({ dynamic: true, size: 4096 }));
		guildImg.setAttribute("alt", this.config.channel.guild.name);
		divContainer.appendChild(guildImg);
		guildDiv.appendChild(divContainer);

		// guild channel div
		divContainer = document.createElement("div");
		divContainer.setAttribute("class", "top__item-container");
		[`Guild: ${this.config.channel.guild.name}`, `Channel: ${this.config.channel.name}`].forEach(
			(str) => {
				const div = document.createElement("div");
				div.setAttribute("class", "top-item");
				div.appendChild(document.createTextNode(str));
				divContainer.appendChild(div);
			}
		);

		const div = document.createElement("div");
		div.setAttribute("class", "top-item top--small");
		div.appendChild(document.createTextNode(`Description: ${this.config.channel.topic || "-"}`));

		divContainer.appendChild(div);
		guildDiv.appendChild(divContainer);

		return guildDiv;
	}

	private getFooter(document: typeof iDocument, amount: number) {
		const mainDiv = document.createElement("div");
		mainDiv.setAttribute("class", "footer");

		let div = document.createElement("div");
		div.setAttribute("class", "footer-item");

		const strong = document.createElement("strong");
		strong.append(this.client.user.tag);
		div.append(strong, ` exported ${amount} message${amount === 1 ? "" : "s"}`);
		mainDiv.appendChild(div);

		div = document.createElement("div");
		div.setAttribute("class", "footer-item");
		div.append(`Date: ${moment(new Date()).tz("Europe/London").format("DD/MM/YYYY h:mm:ss a")}`);
		mainDiv.append(div);

		return mainDiv;
	}
}
