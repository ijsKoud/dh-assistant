import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage, ModerationMessage } from "../../../client/structures/Moderation";
import ms from "ms";
import { setTimeout as setLongTimeout } from "long-timeout";
import moment from "moment";

@ApplyOptions<Command.Options>({
	name: "mute",
	aliases: ["mute"],
	description: "Mutes someone",
	usage: "<user> <reason> [--duration=<duration>]",
	requiredClientPermissions: ["MODERATE_MEMBERS"],
	preconditions: ["GuildOnly", "ModeratorOnly"],
	options: ["duration"]
})
export default class MuteCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: member } = await args.pickResult("member");
		const { value: durationOption } = await args.pickResult("string");
		const { value: reason } = await args.restResult("string");

		if (!member) return message.reply(`>>> ${this.client.constants.emojis.redcross} | Couldn't find that member in this server.`);

		const msg = await message.reply(`>>> ${this.client.constants.emojis.loading} | Muting **${member.user.tag}**...`);
		switch (this.client.permissionHandler.isHigher(message.member, member)) {
			case "mod-low":
				return msg.edit(`>>> ${this.client.constants.emojis.redcross} | You can't mute this user due to role hierarchy.`);
			case "owner":
				return msg.edit(`>>> ${this.client.constants.emojis.redcross} | You can't mute this user because they are the owner of this server.`);
			case "bot":
				return msg.edit(`>>> ${this.client.constants.emojis.redcross} | After all the hard work I have done for you, you want to mute me??`);
			case "bot-low":
				return msg.edit(`>>> ${this.client.constants.emojis.redcross} | I can't mute this user due to role hierarchy.`);
		}

		const id = `${member.id}-${message.guildId}-mute`;
		const mute = this.client.automod.modTimeouts.get(id);
		if (mute) return msg.edit(`>>> ${this.client.constants.emojis.redcross} | This user is already muted in the server.`);

		const date = Date.now();
		const duration = this.client.utils.parseTime(durationOption ?? "");
		if (!duration) {
			await message.reply(
				`>>> ${this.client.constants.emojis.redcross} | I cannot permanently mute someone. You can only mute someone up to 28 days!`
			);
			return;
		}

		const muteLog = await this.client.prisma.modlog.create({
			data: {
				reason: reason ?? "No reason provided",
				id: id.replace("-mute", ""),
				moderator: message.author.id,
				startDate: new Date(date),
				endDate: new Date(date + (duration ?? 0)),
				type: duration ? "mute" : "permmute",
				timeoutFinished: false
			}
		});

		const dm = ModerationMessage.dm(
			reason ?? "No reason provided",
			duration ? "mute" : "permmute",
			member.user,
			`Case Id: ${muteLog.id}`,
			date,
			duration
		);

		const log = ModerationMessage.logs(
			reason ?? "No reason provided",
			duration ? "mute" : "permmute",
			member.user,
			message.author,
			`Case Id: ${muteLog.caseId}`,
			date,
			duration
		);

		this.client.loggingHandler.sendLogs(log, "mod");
		if (duration) {
			const timeout = setLongTimeout(async () => {
				const unmuteReason = `Automatic unmute from mute made by ${message.author.toString()} <t:${moment(date).unix()}:R>`;
				const finishLogs = ModerationMessage.logs(
					unmuteReason,
					"unmute",
					member.user,
					message.author,
					`Reference Case Id: ${muteLog.caseId}`,
					date,
					duration
				);

				await this.client.prisma.modlog.update({
					where: { caseId: muteLog.caseId },
					data: { timeoutFinished: true }
				});
				this.client.loggingHandler.sendLogs(finishLogs, "mod");
			}, duration);
			this.client.automod.modTimeouts.set(id, {
				timeout,
				caseId: muteLog.caseId
			});
		}

		await member.send({ embeds: [dm] }).catch(() => void 0);
		await member.timeout(duration, reason);

		return msg.edit(
			`${`>>> 🔇 | Successfully muted **${member.user.tag}** ${duration ? `for **${ms(duration, { long: true })}**` : ""}`.trim()}.`
		);
	}
}
