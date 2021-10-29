import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage, ModerationMessage } from "../../../client/structures/Moderation";
import { clearTimeout as clearLongTimeout } from "long-timeout";
import { modlog } from "@prisma/client";

@ApplyOptions<Command.Options>({
	name: "unban",
	description: "Unbans a user",
	usage: "<user> [reason]",
	preconditions: ["GuildOnly", "ModeratorOnly"],
})
export default class UnbanCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: user } = await args.pickResult("user");
		const { value: reason } = await args.restResult("string");
		if (!user)
			return message.reply(`>>> ${this.client.constants.emojis.redcross} | No user provided`);

		const msg = await message.reply(
			`>>> ${this.client.constants.emojis.loading} | Unbanning **${user.tag}**...`
		);

		const ban = await message.guild.bans.fetch(user).catch(() => void 0);
		if (!ban)
			return msg.edit(
				`>>> ${this.client.constants.emojis.redcross} | This user is not banned in this server.`
			);

		await message.guild.bans.remove(ban.user, reason ?? `Unbanned by ${message.author.id}`);
		const timeout = this.client.automod.modTimeouts.get(`${user.id}-${message.guildId}-ban`);
		let log: modlog | null = null;

		if (timeout) {
			clearLongTimeout(timeout.timeout);
			this.client.automod.modTimeouts.delete(`${user.id}-${message.guildId}-ban`);

			log = await this.client.prisma.modlog.update({
				where: { caseId: timeout?.caseId },
				data: { timeoutFinished: true },
			});
		}

		const finishLogs = ModerationMessage.logs(
			reason ?? `Unbanned by **${message.author.tag}** (${message.author.toString()})`,
			"unban",
			user,
			message.author,
			`Reference Case Id: ${log?.caseId ?? "unknown"}`,
			Number(log?.startDate ?? 0),
			Number(log?.endDate ? Date.now() : 0) - Number(log?.startDate ?? 0)
		);

		this.client.loggingHandler.sendLogs(
			finishLogs,
			"mod",
			this.client.automod.settings.logging.mod
		);

		await msg.edit(
			`>>> ${this.client.constants.emojis.greentick} | Successfully unbanned **${user.tag}**.`
		);
	}
}
