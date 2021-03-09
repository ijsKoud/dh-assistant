import { GuildMember, MessageEmbed } from "discord.js";
import { Listener } from "discord-akairo";
import ms from "ms";

export default class muteEvent extends Listener {
	constructor() {
		super("muteEvent", {
			emitter: "client",
			event: "muteEvent",
		});
	}

	async exec(offender: GuildMember, moderator: GuildMember, reason: string, duration?: number) {
		const channel = await this.client.utils.getChannel(this.client.config.modlog);

		const embed = new MessageEmbed()
			.setColor(duration ? this.client.colours.orange : this.client.colours.green)
			.setTitle(`User ${duration ? "muted" : "unmuted"} - ${offender.guild.name}`)
			.setFooter(`User ${duration ? "muted" : "unmuted"}`)
			.setDescription([
				`**Offender**: ${offender.user.tag} (${offender.toString()})`,
				`**Moderator**: ${moderator.user.tag} (${moderator.toString()})`,
				`**Duration**: \`${duration ? ms(duration, { long: true }) : "-"}\``,
			])
			.addField("- Reason:", reason.substr(0, 1024) || "no reason given")
			.setTimestamp();

		channel.send(embed);
	}
}
