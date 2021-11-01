import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import type { GuildMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "leveledit",
	description: "Edits the level/xp of someone",
	usage: "<user> <type = 'xp' | 'level'> <value>",
	preconditions: ["GuildOnly", "ManagerOnly"]
})
export default class LeveleditCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: member } = await args.pickResult("member");
		const { value: type } = await args.pickResult("string");
		const { value } = await args.pickResult("number");
		if (!member) return message.reply(`>>> ${this.client.constants.emojis.redcross} | No member provided.`);
		if (!value) return message.reply(`>>> ${this.client.constants.emojis.redcross} | No value provided.`);

		const level = await this.client.prisma.level.findFirst({
			where: { id: `${member.id}-${message.guildId}` }
		});
		if (!level) return message.reply(`>>> ${this.client.constants.emojis.redcross} | No leveling stats found for this user.`);

		switch (type) {
			case "xp":
				level.xp = value;
				break;
			case "level":
				level.level = value;
				break;
			default:
				return message.reply(`>>> ${this.client.constants.emojis.redcross} | The provided type is not one of "xp", "level".`);
		}

		await this.client.prisma.level.update({ where: { id: level.id }, data: level });
		return message.reply(
			`>>> ${this.client.constants.emojis.greentick} | Successfully updated the **${type}** of **${member.user.tag}** to \`${value}\`!`
		);
	}
}
