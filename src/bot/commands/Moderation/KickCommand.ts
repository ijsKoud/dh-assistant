import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Args } from "@sapphire/framework";
import { ModMessage, ModerationMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "kick",
	aliases: ["k"],
	description: "Kicks a user from the server",
	usage: "<user> <reason>",
	requiredClientPermissions: ["KICK_MEMBERS"],
	preconditions: ["GuildOnly", "TrialModeratorOnly"],
})
export default class KickCommand extends Command {
	public async run(message: ModMessage, args: Args) {
		if (!message.guild) return;
		const { client } = this.container;
		const { redcross, loading } = client.constants.emojis;

		const { value: member } = await args.pickResult("member");
		const { value: reason } = await args.restResult("string");
		if (!member) return message.reply(`>>> ${redcross} | Couldn't find that user in this server.`);

		const msg = await message.reply(`>>> ${loading} | Kicking **${member.user.tag}**...`);
		switch (client.permissionHandler.isHigher(message.member, member)) {
			case "mod-low":
				return msg.edit(`>>> ${redcross} | You can't kick this user due to role hierarchy.`);
			case "owner":
				return msg.edit(
					`>>> ${redcross} | You can't kick this user because they are the owner of this server.`
				);
			case "bot":
				return msg.edit(
					`>>> ${redcross} | After all the hard work I have done for you, you want to kick me??`
				);
			case "bot-low":
				return msg.edit(`>>> ${redcross} | I can't kick this user due to role hierarchy.`);
		}

		const date = Date.now();
		const banLog = await client.prisma.modlog.create({
			data: {
				reason: reason ?? "No reason provided",
				id: `${member.id}-${message.guildId}`,
				moderator: message.author.id,
				startDate: BigInt(date),
				type: "kick",
			},
		});

		const dm = ModerationMessage.dm(
			reason ?? "No reason provided",
			"kick",
			member.user,
			`Case Id: ${banLog.id}`,
			date
		);

		const log = ModerationMessage.logs(
			reason ?? "No reason provided",
			"kick",
			member.user,
			message.author,
			`Case Id: ${banLog.caseId}`,
			date
		);

		client.loggingHandler.sendLogs(log, "mod", client.automod.settings.logging.mod);
		await member.send({ embeds: [dm] }).catch(() => void 0);
		await member.kick(reason ?? `Kicked by ${message.author.id}`);

		await msg.edit(`>>> 👞 | Successfully kicked **${member.user.tag}** from the server.`);
	}
}
