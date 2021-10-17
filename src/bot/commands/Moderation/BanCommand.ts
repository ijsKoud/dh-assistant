import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";

import { GuildMessage, ModerationMessage } from "../../../client/structures/Moderation";
import ms from "ms";
import { setTimeout as setLongTimeout } from "long-timeout";
import moment from "moment";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "ban",
	aliases: ["b"],
	description: "Bans a user from the server",
	usage: "<user> <reason> [--duration=<duration>]",
	requiredClientPermissions: ["BAN_MEMBERS"],
	preconditions: ["GuildOnly", "ModeratorOnly"],
	options: ["duration"],
})
export default class BanCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: user } = await args.pickResult("user");
		const { value: reason } = await args.restResult("string");
		const durationOption = args.getOption("duration");
		if (!user)
			return message.reply(`>>> ${emojis.redcross} | Couldn't find that user on discord at all.`);

		const msg = await message.reply(`>>> ${emojis.loading} | Banning **${user.tag}**...`);

		const member = await this.client.utils.fetchMember(user.id, message.guild);
		if (member)
			switch (this.client.permissionHandler.isHigher(message.member, member)) {
				case "mod-low":
					return msg.edit(
						`>>> ${emojis.redcross} | You can't ban this user due to role hierarchy.`
					);
				case "owner":
					return msg.edit(
						`>>> ${emojis.redcross} | You can't ban this user because they are the owner of this server.`
					);
				case "bot":
					return msg.edit(
						`>>> ${emojis.redcross} | After all the hard work I have done for you, you want to ban me??`
					);
				case "bot-low":
					return msg.edit(`>>> ${emojis.redcross} | I can't ban this user due to role hierarchy.`);
			}

		const ban = await message.guild.bans.fetch(user).catch(() => null);
		if (ban)
			return msg.edit(`>>> ${emojis.redcross} | This user is already banned from this server.`);

		const date = Date.now();
		const duration = this.client.utils.parseTime(durationOption ?? "p") || undefined;

		const banLog = await this.client.prisma.modlog.create({
			data: {
				reason: reason ?? "No reason provided",
				id: `${user.id}-${message.guildId}`,
				moderator: message.author.id,
				startDate: BigInt(date),
				endDate: BigInt(date + (duration ?? 0)),
				type: duration ? "tempban" : "ban",
				timeoutFinished: false,
			},
		});

		const dm = ModerationMessage.dm(
			reason ?? "No reason provided",
			duration ? "tempban" : "ban",
			user,
			`Case Id: ${banLog.id}`,
			date,
			duration
		);

		const log = ModerationMessage.logs(
			reason ?? "No reason provided",
			duration ? "tempban" : "ban",
			user,
			message.author,
			`Case Id: ${banLog.caseId}`,
			date,
			duration
		);

		this.client.loggingHandler.sendLogs(log, "mod", this.client.automod.settings.logging.mod);
		if (duration) {
			const timeout = setLongTimeout(async () => {
				const unbanReason = `Automatic unban from ban made by ${message.author.toString()} <t:${moment(
					date
				).unix()}:R>`;
				const finishLogs = ModerationMessage.logs(
					unbanReason,
					"unban",
					user,
					message.author,
					`Reference Case Id: ${banLog.caseId}`,
					date,
					duration
				);

				message.guild.bans.remove(user, unbanReason);
				await this.client.prisma.modlog.update({
					where: { caseId: banLog.caseId },
					data: { timeoutFinished: true },
				});
				this.client.loggingHandler.sendLogs(
					finishLogs,
					"mod",
					this.client.automod.settings.logging.mod
				);
			}, duration);
			this.client.automod.modTimeouts.set(`${user.id}-${message.guildId}-ban`, {
				timeout,
				caseId: banLog.caseId,
			});
		}

		await user.send({ embeds: [dm] }).catch(() => void 0);
		await message.guild.bans.create(user, { reason });

		await msg.edit(
			`>>> 🔨 | Successfully banned **${user.tag}** ${
				duration ? `for **${ms(duration, { long: true })}**` : ""
			}`.trim() + "."
		);
	}
}
