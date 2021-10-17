import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";

import { GuildMessage, ModerationMessage } from "../../../client/structures/Moderation";
import { emojis } from "../../../client/constants";
import { clearTimeout as clearLongTimeout } from "long-timeout";
import { modlog } from ".prisma/client";

@ApplyOptions<Command.Options>({
	name: "Unmute",
	description: "Unmutes a user",
	usage: "<user> [reason]",
	preconditions: ["GuildOnly", "ModeratorOnly"],
})
export default class UnmuteCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: member } = await args.pickResult("member");
		const { value: reason } = await args.restResult("string");
		if (!member) return message.reply(`>>> ${emojis.redcross} | No member provided`);

		const msg = await message.reply(`>>> ${emojis.loading} | Unmuting **${member.user.tag}**...`);
		const { settings, modTimeouts } = this.client.automod;
		if (!member.roles.cache.has(settings.mute.role))
			return msg.edit(`>>> ${emojis.redcross} | This user is not muted in this server.`);

		await member.roles.remove(settings.mute.role);
		const id = `${member.id}-${message.guildId}-mute`;
		const timeout = modTimeouts.get(id);
		let log: modlog | null = null;

		if (timeout) {
			clearLongTimeout(timeout.timeout);
			modTimeouts.delete(id);

			log = await this.client.prisma.modlog.update({
				where: { caseId: timeout?.caseId },
				data: { timeoutFinished: true },
			});
		}

		const finishLogs = ModerationMessage.logs(
			reason ?? `Unmuted by **${message.author.tag}** (${message.author.toString()})`,
			"unban",
			member.user,
			message.author,
			`Reference Case Id: ${log?.caseId ?? "unknown"}`,
			Number(log?.startDate ?? 0),
			Number(log?.endDate ? Date.now() : 0) - Number(log?.startDate ?? 0)
		);

		this.client.loggingHandler.sendLogs(finishLogs, "mod", settings.logging.mod);

		await msg.edit(`>>> ${emojis.greentick} | Successfully unmuted **${member.user.tag}**.`);
	}
}
