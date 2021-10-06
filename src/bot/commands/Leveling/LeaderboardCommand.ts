import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { MessageActionRow, MessageButton } from "discord.js";
import { emojis } from "../../../client/constants";
import { ModMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "Leaderboard",
	aliases: ["levels"],
	description: "Shows the leveling leaderboard with the top 10 users",
	requiredClientPermissions: ["EMBED_LINKS"],
	preconditions: ["GuildOnly"],
})
export default class RankCommand extends Command {
	public async run(message: ModMessage) {
		const data = (await this.client.levelManager.getLevels(message.guild.id))?.slice(0, 10);
		if (!data) return message.reply(`>>> ${emojis.redcross} | Uhm, no one earned xp yet. How?`);

		const embed = this.client.utils
			.embed()
			.setFooter("Only the first 10 users are shown")
			.setTitle("Level Leaderboard")
			.setDescription(
				data
					.map(
						(d) =>
							`\`${(d.i + 1).toString().padStart(2, "0")}\` - <@${d.level.id.split("-")[0]}> (${
								d.level.level
							} / ${this.client.levelManager.getTotal(d.level.level, d.level.xp)})`
					)
					.join("\n")
			);

		const actionRow = new MessageActionRow().addComponents(
			new MessageButton()
				.setURL(`${process.env.DASHBOARD}/leaderboard`)
				.setStyle("LINK")
				.setLabel("Online Leaderboard")
		);

		return message.reply({ embeds: [embed], components: [actionRow] });
	}
}
