import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";

import { GuildMessage, ModerationMessage } from "../../../client/structures/Moderation";
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
	public async messageRun(message: GuildMessage, args: Command.Args) {
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

			const log = ModerationMessage.logs(
				`Modlogs deleted by ${message.author.toString()}`,
				"clearlogs",
				user,
				message.author,
				"Not logged in Database",
				Date.now()
			);
			this.client.loggingHandler.sendLogs(log, "mod", this.client.automod.settings.logging.mod);

			return msg.edit(
				`>>> ${emojis.greentick} | Successfully deleted all the modlogs of **${user.tag}**.`
			);
		}

		const msg = await message.reply(`>>> ${emojis.loading} | Deleting the modlog **${id}**...`);
		const modlog = await this.client.prisma.modlog.findFirst({ where: { caseId: Number(id) } });
		if (!modlog) return;

		await this.client.prisma.modlog.delete({ where: { caseId: modlog.caseId } });

		const user = (await this.client.utils.fetchUser(modlog.id.split("-")[0])) || {
			displayAvatarURL: () => "https://static.daangamesdg.xyz/discord/wumpus.png",
			id: "unknown",
			tag: "User#0000",
		};
		const log = ModerationMessage.logs(
			`Modlog deleted by ${message.author.toString()}`,
			"removelog",
			user,
			message.author,
			`Deleted Id: ${modlog.caseId}`,
			Date.now()
		);
		this.client.loggingHandler.sendLogs(log, "mod", this.client.automod.settings.logging.mod);

		await msg.edit(
			`>>> ${emojis.greentick} | Successfully deleted modlog with the id **${modlog.caseId}**.`
		);
	}
}
