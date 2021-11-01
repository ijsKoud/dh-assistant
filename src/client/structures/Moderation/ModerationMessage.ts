import { HexColorString, ImageURLOptions, MessageEmbed, User } from "discord.js";
import moment from "moment";
import ms from "ms";

export const ModerationMessage = {
	logs(
		reason: string,
		action: string,
		user: User | { displayAvatarURL: (options?: ImageURLOptions) => string; id: string; tag: string },
		moderator: User | { displayAvatarURL: (options?: ImageURLOptions) => string; id: string; tag: string },
		caseId: string,
		date: number,
		duration?: number
	): MessageEmbed {
		const description = (
			duration
				? `**Member**: \`${user.tag}\` (${user.id})\n**Action**: \`${action}\`\n**End of Punishment**: <t:${moment(
						Date.now() + duration
				  ).unix()}:R> (duration: ${ms(duration)})\n**Reason**: ${reason}`
				: `**Member**: \`${user.tag}\` (${user.id})\n**Action**: \`${action}\`\n**Reason**: ${reason}`
		).substr(0, 4096);

		const embed = new MessageEmbed()
			.setColor(this.getColour(action))
			.setAuthor(`${moderator.tag} (${moderator.id})`, moderator.displayAvatarURL({ dynamic: true, size: 4096 }))
			.setFooter(caseId)
			.setTimestamp(date)
			.setDescription(description);

		return embed;
	},
	dm(reason: string, action: string, user: User, caseId: string, date: number, duration?: number): MessageEmbed {
		const description = (
			duration
				? `**Member**: \`${user.tag}\` (${user.id})\n**Action**: \`${action}\`\n**End**: <t:${moment(Date.now() + duration).unix()}:R> (${ms(
						duration
				  )})\n**Reason**: ${reason}`
				: `**Member**: \`${user.tag}\` (${user.id})\n**Action**: \`${action}\`\n**Reason**: ${reason}`
		).substr(0, 4096);

		const embed = new MessageEmbed()
			.setColor(process.env.COLOUR as `#${string}`)
			.setAuthor("User#0000", "https://static.daangamesdg.xyz/discord/wumpus.png")
			.setFooter(caseId)
			.setTimestamp(date)
			.setDescription(description);

		return embed;
	},
	getColour(type: string): HexColorString {
		switch (type) {
			case "ban":
				return "#FD5B5E";
			case "tempban":
			case "softban":
				return "#F6945B";
			case "warn":
			case "mute":
				return "#FFDA69";
			case "unmute":
			case "unban":
				return "#62FEA3";
			default:
				return "#2F3136";
		}
	}
};
