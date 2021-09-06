import { Command } from "../../../client/structures/Command";
import { ApplyOptions } from "@sapphire/decorators";
import { Message, MessageAttachment } from "discord.js";
import { Args } from "@sapphire/framework";
import Rank from "../../../client/structures/Rank";

@ApplyOptions<Command.Options>({
	name: "rank",
	aliases: ["rankcard"],
	description: "Shows the rankcard of someone",
	usage: "[user]",
	requiredClientPermissions: ["ATTACH_FILES"],
	preconditions: ["GuildOnly"],
})
export default class RankCommand extends Command {
	public async run(message: Message, args: Args) {
		if (!message.guild) return;

		const { client } = this.container;
		let { value: user } = await args.pickResult("user");
		if (!user) user = message.author;

		const ranks = await client.levelManager.getLevels(message.guild.id);
		const stats = ranks.find((r) => r.level.id.startsWith(user?.id ?? ""));
		if (!stats)
			return message.reply(
				`>>> ${client.constants.emojis.redcross} | No leveling stats found for **${user.tag}**`
			);

		const file = await new Rank({
			username: user.username,
			discrim: user.discriminator,
			avatar: user.displayAvatarURL({ format: "png", size: 256 }),
			level: stats.level.level,
			rank: stats.i + 1,
			required: stats.level.level * 75,
			xp: client.levelManager.getTotal(stats.level.level, stats.level.xp),
		}).build();

		return message.reply({ files: [new MessageAttachment(file, "rankcard.png")] });
	}
}
