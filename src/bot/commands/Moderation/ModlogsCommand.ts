import { Command } from "../../../client/structures/Command";
import { ApplyOptions } from "@sapphire/decorators";
import { EmbedField, Message, MessageEmbed } from "discord.js";
import { Args } from "@sapphire/framework";
import { modlog } from ".prisma/client";
import moment from "moment";

@ApplyOptions<Command.Options>({
	name: "modlogs",
	aliases: ["warns", "warnings", "modlog"],
	description: "Shows the modlogs of a user",
	usage: "[user]",
	requiredClientPermissions: ["EMBED_LINKS"],
	preconditions: ["GuildOnly"],
})
export default class ModlogsCommand extends Command {
	public async run(message: Message, args: Args) {
		if (!message.guild) return;

		const { client } = this.container;
		const { value: user } = await args.pickResult("user");
		if (!user) {
			const logs = await client.prisma.modlog.findMany({
				where: { id: { endsWith: message.guild.id } },
			});
			if (!logs.length) return message.reply(">>> 🎉 | No modlogs found for this server.");

			const sorted = logs
				.map((x) => ({
					userId: x.id.split("-")[0],
					logs: logs.filter((v) => v.id === x.id).length,
				}))
				.sort((a, b) => b.logs - a.logs);

			const embed = client.utils
				.embed()
				.setTitle(`Modlogs - ${message.guild.name}`)
				.setDescription(
					sorted
						.map((m) => `\`${m.logs}\` - <@!${m.userId}>`)
						.join("\n")
						.substr(0, 4096)
				);

			return message.reply({ embeds: [embed] });
		}

		const logs = await client.prisma.modlog.findMany({
			where: { id: `${message.author.id}-${message.guild.id}` },
		});
		if (!logs.length) return message.reply(">>> 🎉 | No modlogs found for this user.");

		const embed = client.utils.embed().setTitle(`${logs.length} warnings found for ${user.tag}`);
		const embeds = this.generateEmbeds(logs, embed);
		if (embeds.length === 1) return message.reply({ embeds: [embeds[0]] });

		const msg = await message.reply({ embeds: [embeds[0]] });
		// to do: add pagination
	}

	private generateEmbeds(items: modlog[], base: MessageEmbed): MessageEmbed[] {
		const embeds: MessageEmbed[] = [];
		let count = 25;

		for (let i = 0; i < items.length; i += 25) {
			const current = items.slice(i, count);

			const map: EmbedField[] = current.map((data) => {
				return {
					name: `${data.caseId} | ${moment(Number(data.startDate)).format("MMMM Do YYYY")}`,
					value: `Moderator: <@${data.moderator}>\nReason: ${data.reason.substr(0, 900)}`,
					inline: true,
				};
			});
			count += 25;

			embeds.push(new MessageEmbed(base).addFields(...map));
		}

		return embeds;
	}
}
