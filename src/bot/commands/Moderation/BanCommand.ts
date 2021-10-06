import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Args } from "@sapphire/framework";
import { ModMessage, ModerationMessage } from "../../../client/structures/Moderation";
import ms from "ms";
import { setTimeout as setLongTimeout } from "long-timeout";
import moment from "moment";

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
	public async run(message: ModMessage, args: Args) {
		if (!message.guild) return;
		const { client } = this.container;
		const { redcross, loading } = client.constants.emojis;

		const { value: user } = await args.pickResult("user");
		const { value: reason } = await args.restResult("string");
		const durationOption = args.getOption("duration");
		if (!user) return message.reply(`>>> ${redcross} | Couldn't find that user on discord at all.`);

		const msg = await message.reply(`>>> ${loading} | Banning **${user.tag}**...`);

		const member = await client.utils.fetchMember(user.id, message.guild);
		if (member)
			switch (client.permissionHandler.isHigher(message.member, member)) {
				case "mod-low":
					return msg.edit(`>>> ${redcross} | You can't ban this user due to role hierarchy.`);
				case "owner":
					return msg.edit(
						`>>> ${redcross} | You can't ban this user because they are the owner of this server.`
					);
				case "bot":
					return msg.edit(
						`>>> ${redcross} | After all the hard work I have done for you, you want to ban me??`
					);
				case "bot-low":
					return msg.edit(`>>> ${redcross} | I can't ban this user due to role hierarchy.`);
			}

		const ban = await message.guild.bans.fetch(user).catch(() => null);
		if (ban) return msg.edit(`>>> ${redcross} | This user is already banned from this server.`);

		const date = Date.now();
		const duration = client.utils.parseTime(durationOption ?? "p") || undefined;

		const banLog = await client.prisma.modlog.create({
			data: {
				reason: reason ?? "No reason provided",
				id: `${user.id}-${message.guildId}`,
				moderator: message.author.id,
				startDate: BigInt(date),
				endDate: BigInt(date + (duration ?? 0)),
				type: duration ? "tempban" : "ban",
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

		client.loggingHandler.sendLogs(log, "mod", client.automod.settings.logging.mod);
		if (duration) {
			const timeout = setLongTimeout(() => {
				const unbanReason = `Automatic unban from tempban made by ${message.author.toString()} <t:${moment(
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
				client.loggingHandler.sendLogs(finishLogs, "mod", client.automod.settings.logging.mod);
			}, duration);

			client.automod.modTimeouts.set(`${user.id}-${message.guildId}-ban`, timeout);
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
