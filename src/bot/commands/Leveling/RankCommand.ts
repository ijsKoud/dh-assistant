import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { MessageAttachment } from "discord.js";
import { Args } from "@sapphire/framework";
import Rank from "../../../client/structures/Rank";
import { emojis } from "../../../client/constants";
import { GuildMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "rank",
	aliases: ["rankcard"],
	description: "Shows the rankcard of someone",
	usage: "[user]",
	requiredClientPermissions: ["ATTACH_FILES"],
	preconditions: ["GuildOnly"],
})
export default class RankCommand extends Command {
	public async run(message: GuildMessage, args: Args) {
		let { value: member } = await args.pickResult("member");
		if (!member) member = message.member;

		const ranks = await this.client.levelManager.getLevels(message.guild.id);
		const stats = ranks.find((r) => r.level.id.startsWith(member?.id ?? ""));
		if (!stats)
			return message.reply(
				`>>> ${emojis.redcross} | No leveling stats found for **${member.user.tag}**`
			);

		const file = await new Rank({
			username: member.user.username,
			discrim: member.user.discriminator,
			avatar: member.displayAvatarURL({ format: "png", size: 256 }),
			level: stats.level.level,
			rank: stats.i + 1,
			required: stats.level.level * 75,
			xp: stats.level.xp,
		}).build();

		return message.reply({ files: [new MessageAttachment(file, "rankcard.png")] });
	}
}
