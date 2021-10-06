import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { MessageAttachment } from "discord.js";
import { Args } from "@sapphire/framework";
import Rank from "../../../client/structures/Rank";
import { emojis } from "../../../client/constants";
import { ModMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "rank",
	aliases: ["rankcard"],
	description: "Shows the rankcard of someone",
	usage: "[user]",
	requiredClientPermissions: ["ATTACH_FILES"],
	preconditions: ["GuildOnly"],
})
export default class RankCommand extends Command {
	public async run(message: ModMessage, args: Args) {
		let { value: user } = await args.pickResult("user");
		if (!user) user = message.author;

		const ranks = await this.client.levelManager.getLevels(message.guild.id);
		const stats = ranks.find((r) => r.level.id.startsWith(user?.id ?? ""));
		if (!stats)
			return message.reply(`>>> ${emojis.redcross} | No leveling stats found for **${user.tag}**`);

		const file = await new Rank({
			username: user.username,
			discrim: user.discriminator,
			avatar: user.displayAvatarURL({ format: "png", size: 256 }),
			level: stats.level.level,
			rank: stats.i + 1,
			required: stats.level.level * 75,
			xp: stats.level.xp,
		}).build();

		return message.reply({ files: [new MessageAttachment(file, "rankcard.png")] });
	}
}
