import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "reason",
	description: "Updates the reason of a modlog",
	usage: "<modlog id> <reason>",
	preconditions: ["GuildOnly", "TrialModeratorOnly"]
})
export default class ReasonCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: id } = await args.pickResult("number");
		const { value: reason } = await args.restResult("string");
		if (!id || isNaN(id)) return message.reply(`>>> ${this.client.constants.emojis.redcross} | No modlog Id provided.`);
		if (!reason) return message.reply(`>>> ${this.client.constants.emojis.redcross} | No reason provided.`);

		const msg = await message.reply(`>>> ${this.client.constants.emojis.loading} | Updating reason of modlog **${id}**...`);

		const modlog = await this.client.prisma.modlog.findFirst({ where: { caseId: id } });
		if (!modlog) return msg.edit(`>>> ${this.client.constants.emojis.redcross} | No modlog found with the id **${id}**!`);

		await this.client.prisma.modlog.update({ where: { caseId: modlog.caseId }, data: { reason } });
		await msg.edit(`>>> ${this.client.constants.emojis.greentick} | Successfully updated the reason of modlog **${modlog.caseId}**.`);
	}
}
