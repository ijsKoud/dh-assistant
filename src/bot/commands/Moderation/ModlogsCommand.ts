import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { EmbedField, MessageButton, MessageEmbed, Collection } from "discord.js";

import { modlog } from ".prisma/client";
import { v4 as uuid } from "uuid";
import moment from "moment";
import { GuildMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "modlogs",
	aliases: ["warns", "warnings", "modlog"],
	description: "Shows the modlogs of a user",
	usage: "[user]",
	requiredClientPermissions: ["EMBED_LINKS"],
	preconditions: ["GuildOnly", "TrialModeratorOnly"]
})
export default class ModlogsCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: user } = await args.pickResult("user");
		if (!user) {
			const logs = await this.client.prisma.modlog.findMany({
				where: { id: { endsWith: message.guild.id } }
			});
			if (!logs.length) return message.reply(">>> 🎉 | No modlogs found for this server.");

			const tempCache = new Collection<string, number>();
			logs.forEach((w) => tempCache.set(w.id, (tempCache.get(w.id) ?? 0) + 1));

			const warns = tempCache.sort((a, b) => b - a).map((amount, id) => ({ id, logs: amount }));

			const embed = this.client.utils
				.embed()
				.setTitle(`Modlogs - ${message.guild.name}`)
				.setURL(`${process.env.DASHBOARD}/modlogs`)
				.setDescription(
					warns
						.map((m) => `\`${m.logs}\` - <@!${m.id.split("-")[0]}>`)
						.join("\n")
						.substr(0, 4096)
				);

			return message.reply({ embeds: [embed] });
		}

		const logs = await this.client.prisma.modlog.findMany({
			where: { id: `${user.id}-${message.guild.id}` }
		});
		if (!logs.length) return message.reply(">>> 🎉 | No modlogs found for this user.");

		const embed = this.client.utils
			.embed()
			.setTitle(`${logs.length} warnings found for ${user.tag}`)
			.setURL(`${process.env.DASHBOARD}/modlogs/${user.id}`);

		const embeds = this.generateEmbeds(logs, embed);
		if (embeds.length === 1) return message.reply({ embeds: [embeds[0]] });

		const buttons = [
			new MessageButton()
				.setEmoji("◀")
				.setStyle("SECONDARY")
				.setCustomId(`${uuid().slice(0, 20)}-${message.guildId}-previous`),
			new MessageButton()
				.setEmoji("🗑")
				.setStyle("DANGER")
				.setCustomId(`${uuid().slice(0, 20)}-${message.guildId}-delete`),
			new MessageButton()
				.setEmoji("▶")
				.setStyle("SECONDARY")
				.setCustomId(`${uuid().slice(0, 20)}-${message.guildId}-next`)
		];
		const msg = await message.reply({ embeds: [embeds[0]] });
		this.client.utils.pagination(msg, embeds, buttons);
	}

	private generateEmbeds(items: modlog[], base: MessageEmbed): MessageEmbed[] {
		const embeds: MessageEmbed[] = [];
		let count = 25;

		for (let i = 0; i < items.length; i += 25) {
			const current = items.slice(i, count);

			const map: EmbedField[] = current.map((data) => {
				return {
					name: `${data.caseId} | ${this.client.utils.capitalize(data.type)}`,
					value: `Date: ${this.container.client.utils.formatTime(moment(Number(data.startDate)).unix(), "R")}\nModerator: <@${
						data.moderator
					}>\nReason: ${data.reason.substr(0, 200)}`,
					inline: true
				};
			});
			count += 25;

			embeds.push(new MessageEmbed(base).addFields(...map));
		}

		return embeds;
	}
}
