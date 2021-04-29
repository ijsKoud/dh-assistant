import prClient from "../../client/client";
import { JSDOM } from "jsdom";
import { Message, TextChannel, MessageEmbed } from "discord.js";
import DiscordMD from "./discord-markdown";
import twemoji from "twemoji";

const iDocument = new JSDOM().window.document;

export default class markdownParser {
	constructor(public client: prClient) {}

	public parseContent(message: Message, embed: boolean = false) {
		const html = DiscordMD.toHTML(message.content, {
			embed,
			discordCallback: {
				guildId: message.guild?.id,
				user: ({ id }: { id: string }) => {
					const user = this.client.users.cache.get(id);
					return user ? `@${user.username}` : `<@${id}>`;
				},
				channel: ({ id }: { id: string }) => {
					const channel =
						message.mentions.channels.get(id)?.name ||
						(this.client.channels.cache.get(id) as TextChannel)?.name;
					return channel ? `#${channel}` : `<#${id}>`;
				},
				role: ({ id }: { id: string }) => {
					const role = message.guild.roles.cache.get(id);
					return role ? `@${role.name}` : `<@${id}>`;
				},
			},
		}) as string;
		const parsed = new JSDOM(
			`<div id="content">${this._parse(html)}</div>`
		).window.document.getElementById("content");
		parsed.setAttribute("id", "");

		return parsed;
	}

	public parseEmbed(document: typeof iDocument, message: Message, embeds?: MessageEmbed[]) {
		if (!embeds?.length) embeds = message.embeds;
		const parsed = [];

		for (const embed of embeds) {
			const embedDiv = document.createElement("div");
			embedDiv.setAttribute("class", "embed");

			const color = document.createElement("div");
			color.setAttribute("class", "embed-bar embed-color--default");
			color.setAttribute("style", `background-color: ${embed.hexColor || "#000000"}`);

			const McontentContainer = document.createElement("div");
			McontentContainer.setAttribute("class", "embed-content-container");

			const contentContainer = document.createElement("div");
			contentContainer.setAttribute("class", "embed-content");

			const textContainer = document.createElement("div");
			textContainer.setAttribute("class", "embed-text");

			if (embed.author) {
				const author = document.createElement("div");
				author.setAttribute("class", "embed-author");

				const name = document.createElement("div");
				name.setAttribute("class", "embed-author-name");
				name.append(embed.author.name);

				if (embed.author.iconURL) {
					const avatar = document.createElement("img");
					avatar.setAttribute("class", "embed-author-icon");
					avatar.setAttribute("alt", "Embed Author Avatar");
					avatar.setAttribute("src", embed.author.iconURL);

					author.appendChild(avatar);
				}

				if (embed.author.url) {
					const a = document.createElement("a");
					a.setAttribute("class", "embed-author-link");
					a.setAttribute("href", embed.author.url);
					a.setAttribute("style", "color: #fff");

					name.setAttribute("style", "cursor: pointer;");
					a.appendChild(name);
					author.appendChild(a);
				} else author.appendChild(name);

				textContainer.appendChild(author);
			}

			if (embed.title) {
				message.content = embed.title;
				const div = this.parseContent(message);
				div.setAttribute("class", "markdown preserve-whitespace");

				const title = document.createElement("div");
				title.setAttribute("class", "embed-title");

				if (embed.url) {
					const a = document.createElement("a");
					a.setAttribute("class", "embed-title-link");
					a.setAttribute("href", embed.url);

					div.setAttribute("style", "cursor: pointer;");
					a.appendChild(div);
					title.appendChild(a);
				} else title.appendChild(div);
				textContainer.append(title);
			}

			if (embed.description) {
				message.content = embed.description;
				const div = this.parseContent(message, true);
				div.setAttribute("class", "markdown preserve-whitespace");

				const Description = document.createElement("div");
				Description.setAttribute("class", "embed-description");
				Description.appendChild(div);

				textContainer.appendChild(Description);
			}

			if (embed.fields) {
				const fields = document.createElement("div");
				fields.setAttribute("class", "embed-fields");
				fields.append(
					...embed.fields.map((f) => this.getField(document, message, f)).filter((div) => div)
				);

				textContainer.appendChild(fields);
			}

			// images / videos
			const imgContainer = document.createElement("div");
			imgContainer.setAttribute("class", "embed-image-container");
			if (embed.image) {
				const a = document.createElement("a");
				a.setAttribute("class", "embed-image-link");
				a.setAttribute("href", embed.image.url);

				const img = document.createElement("img");
				img.setAttribute("class", "embed-image");
				img.setAttribute("alt", "Image Attachment");
				img.setAttribute("src", embed.image.url);
				img.setAttribute("style", "cursor: pointer;");
				img.setAttribute("height", "300");

				a.appendChild(img);
				imgContainer.appendChild(a);
			}

			contentContainer.appendChild(textContainer);

			const thumbnailContainer = document.createElement("div");
			thumbnailContainer.setAttribute("class", "embed-thumbnail-container");
			if (embed.thumbnail) {
				const a = document.createElement("a");
				a.setAttribute("href", embed.thumbnail.url);

				const img = document.createElement("img");
				img.setAttribute("class", "embed-thumbnail");
				img.setAttribute("alt", "Thumbnail Attachment");
				img.setAttribute("src", embed.thumbnail.url);
				img.setAttribute("style", "cursor: pointer;");

				a.appendChild(img);
				thumbnailContainer.appendChild(a);
				contentContainer.appendChild(thumbnailContainer);
			}

			McontentContainer.appendChild(contentContainer);
			if (imgContainer?.childNodes?.length) McontentContainer.appendChild(imgContainer);

			if (embed.footer) {
				const footer = document.createElement("div");
				footer.setAttribute("class", "embed-footer");

				if (embed.footer.iconURL) {
					const avatar = document.createElement("img");
					avatar.setAttribute("class", "embed-footer-icon");
					avatar.setAttribute("alt", "Embed Footer Avatar");
					avatar.setAttribute("src", embed.footer.iconURL);

					footer.appendChild(avatar);
				}

				const text = document.createElement("span");
				text.setAttribute("class", "embed-footer-text");
				text.append(embed.footer.text ?? "");
				footer.appendChild(text);

				McontentContainer.appendChild(footer);
			}

			embedDiv.append(color, McontentContainer);
			parsed.push(embedDiv);
		}

		return parsed;
	}

	private _parse(data: string): string {
		data = twemoji.parse(data);
		data = data.replace(/\/blockquote/g, "div").replace(/blockquote/g, 'div class="quote"');
		return data;
	}

	private getField(
		document: typeof iDocument,
		message: Message,
		{ name, value, inline }: { name: string; value: string; inline: boolean }
	) {
		const field = document.createElement("div");
		field.setAttribute("class", `embed-field${inline ? " embed-field--inline" : ""}`);

		const nameDiv = document.createElement("div");
		nameDiv.setAttribute("class", "embed-field-name");

		message.content = name;
		let parsed = this.parseContent(message, false);
		parsed.setAttribute("class", "markdown preserve-whitespace");
		nameDiv.appendChild(parsed);

		const description = document.createElement("div");
		description.setAttribute("class", "embed-field-value");

		message.content = value;
		parsed = this.parseContent(message, true);
		parsed.setAttribute("class", "markdown preserve-whitespace");
		description.appendChild(parsed);

		field.append(nameDiv, description);
		return field;
	}
}
