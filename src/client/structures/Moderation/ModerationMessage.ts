import { MessageEmbed, User } from "discord.js";
import moment from "moment";
import ms from "ms";

export class ModerationMessage {
	static logs(
		reason: string,
		action: string,
		user: User,
		moderator: User,
		caseId: string,
		date: number,
		duration?: number
	): MessageEmbed {
		const description = (
			duration
				? `**Member**: \`${user.tag}\` (${
						user.id
				  })\n**Action**: \`${action}\`\n**End of Punishment**: <t:${moment(
						Date.now() + duration
				  ).unix()}:R> (duration: ${ms(duration)})\n**Reason**: ${reason}`
				: `**Member**: \`${user.tag}\` (${user.id})\n**Action**: \`${action}\`\n**Reason**: ${reason}`
		).substr(0, 4096);

		const embed = new MessageEmbed()
			.setColor(process.env.COLOUR as `#${string}`)
			.setAuthor(
				`${moderator.tag} (${moderator.id})`,
				moderator.displayAvatarURL({ dynamic: true, size: 4096 })
			)
			.setFooter(caseId)
			.setTimestamp(date)
			.setDescription(description);

		return embed;
	}

	static dm(
		reason: string,
		action: string,
		user: User,
		caseId: string,
		date: number,
		duration?: number
	): MessageEmbed {
		const description = (
			duration
				? `**Member**: \`${user.tag}\` (${
						user.id
				  })\n**Action**: \`${action}\`\n**End**: <t:${moment(
						Date.now() + duration
				  ).unix()}:R> (${ms(duration)})\n**Reason**: ${reason}`
				: `**Member**: \`${user.tag}\` (${user.id})\n**Action**: \`${action}\`\n**Reason**: ${reason}`
		).substr(0, 4096);

		const embed = new MessageEmbed()
			.setColor(process.env.COLOUR as `#${string}`)
			.setAuthor("User#0000", "https://cdn.daangamesdg.xyz/discord/wumpus.png")
			.setFooter(caseId)
			.setTimestamp(date)
			.setDescription(description);

		return embed;
	}
}
