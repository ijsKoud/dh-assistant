import { Command } from "discord-akairo";
import Warn from "../../model/moderation/Warn";
import {
	MessageEmbed,
	Collection,
	Message,
	EmbedField,
	MessageReaction,
	User,
	TextChannel,
} from "discord.js";
import moment from "moment";
import { iWarn } from "../../model/interfaces";

export default class warns extends Command {
	constructor() {
		super("warns", {
			aliases: ["warns", "warnings"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			description: {
				content: "Get all the warnings of a user or the users with warnings.",
				usage: "warns [user]",
			},
			cooldown: 1e3,
			args: [
				{
					id: "id",
					type: "string",
					default: "user",
				},
			],
		});
	}

	async exec(message: Message, { id }: { id: string }) {
		const member = await this.client.utils.fetchMember(id, message.guild);
		const embed = new MessageEmbed().setColor(this.client.hex);

		if (member) {
			const data = await Warn.find({ guildId: message.guild.id, userId: member.id });
			if (!data?.length) return message.util.send(`No warnings found for **${member.user.tag}**.`);

			embed.setTitle(`${data.length} warnings found for ${member.user.tag}`);

			const embeds = this.generateEmbeds(data, embed);
			if (embeds.length === 1) return message.util.send(embeds[0]);

			const msg = await message.channel.send(embeds[0]);
			return this.pagination(msg, embeds);
		} else {
			const data = await Warn.find({ guildId: message.guild.id });
			if (!data.length) return message.channel.send(`No warnings for this server found, yay!`);

			const tempCache = new Collection<string, number>();
			data.forEach((w) =>
				tempCache.set(w.userId, tempCache.get(w.userId) ? tempCache.get(w.userId) + 1 : 1)
			);
			const warns: { id: string; warns: number }[] = tempCache
				.sort((a, b) => b - a)
				.map((v, k) => {
					return { id: k, warns: data.filter((v) => v.userId === k).length };
				});

			embed.setTitle("Users with warnings in this server").setDescription(
				warns
					.map((w) => `<@${w.id}> - **${w.warns}**`)
					.join("\n")
					.substr(0, 2048)
			);

			await message.channel.send(embed);
		}
	}

	generateEmbeds(items: iWarn[], base: MessageEmbed): MessageEmbed[] {
		const embeds: MessageEmbed[] = [];
		let count: number = 25;

		for (let i = 0; i < items.length; i += 25) {
			const current = items.slice(i, count);

			const map: EmbedField[] = current.map((data) => {
				return {
					name: `${data.caseId} | ${moment(data.date).format("MMMM Do YYYY")}`,
					value: `Moderator: <@${data.moderator}>\nReason: ${data.reason.substr(0, 900)}`,
					inline: true,
				};
			});
			count += 25;

			embeds.push(new MessageEmbed(base).addFields(...map));
		}

		return embeds;
	}

	async pagination(
		message: Message,
		pages: MessageEmbed[],
		emojiList: string[] = ["◀", "🗑", "▶"],
		timeout = 12e4,
		pageNumber: number = 1
	) {
		let page = pageNumber;
		const currentPage = message;

		emojiList.forEach((emoji) => currentPage.react(emoji));

		const filter = (reaction: MessageReaction, user: User) => {
			return emojiList.includes(reaction.emoji.name) && !user.bot;
		};
		const collector = currentPage.createReactionCollector(filter, {
			time: timeout,
		});

		collector.on("collect", (reaction: MessageReaction, user: User) => {
			switch (reaction.emoji.name) {
				case emojiList[0]:
					page = page === 1 ? pages.length : page - 1;
					break;
				case emojiList[2]:
					page = page === pages.length ? 1 : page + 1;
					break;
				case emojiList[1]:
					return currentPage.delete();
				default:
					break;
			}

			if ((message.channel as TextChannel).permissionsFor(message.guild.me).has("MANAGE_MESSAGES"))
				reaction.users.remove(user);
			currentPage.edit(pages[page - 1].setFooter(`Page ${page} of ${pages.length}`));
		});

		collector.on("end", () => {
			if (
				!currentPage.deleted &&
				(message.channel as TextChannel).permissionsFor(message.guild.me).has("MANAGE_MESSAGES")
			)
				currentPage.reactions.removeAll();
		});
	}
}
