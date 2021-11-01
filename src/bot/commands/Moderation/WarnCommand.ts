import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage, ModerationMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "warn",
	aliases: ["w"],
	description: "Warns a user",
	usage: "<user> <reason>",
	preconditions: ["GuildOnly", "TrialModeratorOnly"]
})
export default class WarnCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: member } = await args.pickResult("member");
		const { value: reason } = await args.restResult("string");
		if (!member) return message.reply(`>>> ${this.client.constants.emojis.redcross} | Couldn't find that user in this server.`);

		const msg = await message.reply(`>>> ${this.client.constants.emojis.loading} | Warning **${member.user.tag}**...`);
		switch (this.client.permissionHandler.isHigher(message.member, member)) {
			case "mod-low":
				return msg.edit(`>>> ${this.client.constants.emojis.redcross} | You can't warn this user due to role hierarchy.`);
			case "owner":
				return msg.edit(`>>> ${this.client.constants.emojis.redcross} | You can't warn this user because they are the owner of this server.`);
			case "bot":
				return msg.edit(`>>> ${this.client.constants.emojis.redcross} | After all the hard work I have done for you, you want to warn me??`);
			case "bot-low":
				return msg.edit(`>>> ${this.client.constants.emojis.redcross} | I can't warn this user due to role hierarchy.`);
		}

		const date = Date.now();
		const warnLog = await this.client.prisma.modlog.create({
			data: {
				reason: reason ?? "No reason provided",
				id: `${member.id}-${message.guildId}`,
				moderator: message.author.id,
				startDate: new Date(date),
				type: "warn"
			}
		});

		const dm = ModerationMessage.dm(reason ?? "No reason provided", "warn", member.user, `Case Id: ${warnLog.id}`, date);

		const log = ModerationMessage.logs(reason ?? "No reason provided", "warn", member.user, message.author, `Case Id: ${warnLog.caseId}`, date);

		this.client.loggingHandler.sendLogs(log, "mod");
		await member.send({ embeds: [dm] }).catch(() => void 0);

		await msg.edit(`>>> ${this.client.constants.emojis.greentick} | Successfully warned **${member.user.tag}**.`);
	}
}
