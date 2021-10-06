import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Args } from "@sapphire/framework";
import { GuildMessage } from "../../../client/structures/Moderation";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "clearlogs",
	aliases: ["removelog", "removelogs", "removemodlog", "removemodlogs"],
	description: "Deletes modlog(s) of a user",
	usage: "<modlog id or user id> [--user -> is required when using userId]",
	preconditions: ["GuildOnly", "ModeratorOnly"],
	flags: ["user"],
})
export default class ClearlogsCommand extends Command {
	public async run(message: GuildMessage, args: Args) {
		const { value: id } = await args.pickResult("string");
		const userFlag = args.getFlags("user");
		if (userFlag) {
			const user = await this.client.utils.fetchUser(id ?? "");
			if (!user)
				return message.reply(
					`>>> ${emojis.redcross} | I could not find that user on Discord at all.`
				);

			const msg = await message.reply(
				`>>> ${emojis.loading} | Deleting the modlogs of **${user.tag}**...`
			);

			await this.client.prisma.modlog.deleteMany({
				where: { id: `${user.id}-${message.guild.id}` },
			});
			return msg.edit(
				`>>> ${emojis.greentick} | Successfully deleted all the modlogs of **${user.tag}**.`
			);
		}

		const msg = await message.reply(`>>> ${emojis.loading} | Deleting the modlog **${id}**...`);
		const modlog = await this.client.prisma.modlog.findFirst({ where: { caseId: Number(id) } });
		if (!modlog) return;

		await this.client.prisma.modlog.delete({ where: { caseId: modlog.caseId } });
		await msg.edit(
			`>>> ${emojis.greentick} | Successfully deleted modlog with the id **${modlog.caseId}**.`
		);
	}
}
