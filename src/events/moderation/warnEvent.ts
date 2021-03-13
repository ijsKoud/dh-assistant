import { GuildMember, MessageEmbed } from "discord.js";
import { Listener } from "discord-akairo";

export default class warnEvent extends Listener {
	constructor() {
		super("warnEvent", {
			emitter: "client",
			event: "warnEvent",
		});
	}

	async exec(offender: GuildMember, moderator: GuildMember, reason: string, caseId: string) {
		const channel = await this.client.utils.getChannel(this.client.config.modlog);

		const embed = new MessageEmbed()
			.setColor(this.client.colours.yellow)
			.setTitle(`User warn - ${offender.guild.name}`)
			.setFooter(`User warn`)
			.setDescription([
				`**Offender**: ${offender.user.tag} (${offender.toString()})`,
				`**Moderator**: ${moderator.user.tag} (${moderator.toString()})`,
				`**Case Id**: \`${caseId}\``,
			])
			.addField("- Reason:", reason.substr(0, 1024) || "no reason given")
			.setTimestamp();

		channel.send(embed);
	}
}
