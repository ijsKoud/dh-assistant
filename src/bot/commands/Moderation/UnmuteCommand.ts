import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage, ModerationMessage } from "../../../client/structures/Moderation";
import { clearTimeout as clearLongTimeout } from "long-timeout";
import type { modlog } from ".prisma/client";

@ApplyOptions<Command.Options>({
	name: "Unmute",
	description: "Unmutes a user",
	usage: "<user> [reason]",
	preconditions: ["GuildOnly", "ModeratorOnly"]
})
export default class UnmuteCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: member } = await args.pickResult("member");
		const { value: reason } = await args.restResult("string");
		if (!member) return message.reply(`>>> ${this.client.constants.emojis.redcross} | No member provided`);

		const msg = await message.reply(`>>> ${this.client.constants.emojis.loading} | Unmuting **${member.user.tag}**...`);
		const { modTimeouts } = this.client.automod;
		if (!member.communicationDisabledUntil)
			return msg.edit(`>>> ${this.client.constants.emojis.redcross} | This user is not muted in this server.`);

		await member.timeout(null);
		const id = `${member.id}-${message.guildId}-mute`;
		const timeout = modTimeouts.get(id);
		let log: modlog | null = null;

		if (timeout) {
			clearLongTimeout(timeout.timeout);
			modTimeouts.delete(id);

			log = await this.client.prisma.modlog.update({
				where: { caseId: timeout?.caseId },
				data: { timeoutFinished: true }
			});
		}

		const finishLogs = ModerationMessage.logs(
			reason ?? `Unmuted by **${message.author.tag}** (${message.author.toString()})`,
			"unmute",
			member.user,
			message.author,
			`Reference Case Id: ${log?.caseId ?? "unknown"}`,
			Number(log?.startDate ?? 0),
			Number(log?.endDate ? Date.now() : 0) - Number(log?.startDate ?? 0)
		);

		this.client.loggingHandler.sendLogs(finishLogs, "mod");

		return msg.edit(`>>> ${this.client.constants.emojis.greentick} | Successfully unmuted **${member.user.tag}**.`);
	}
}
