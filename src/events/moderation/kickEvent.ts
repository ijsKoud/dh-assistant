import { GuildMember, MessageEmbed } from "discord.js";
import { Listener } from "discord-akairo";

export default class kickEvent extends Listener {
	constructor() {
		super("kickEvent", {
			emitter: "client",
			event: "kickEvent",
		});
	}

	async exec(offender: GuildMember, moderator: GuildMember, reason: string) {
		const channel = await this.client.utils.getChannel(this.client.config.modlog);

		const embed = new MessageEmbed()
			.setColor(this.client.colours.red)
			.setTitle(`User kicked - ${offender.guild.name}`)
			.setFooter(`User kicked`)
			.setDescription([
				`**Offender**: ${offender.user.tag} (${offender.toString()})`,
				`**Moderator**: ${moderator.user.tag} (${moderator.toString()})`,
			])
			.addField("- Reason:", reason.substr(0, 1024) || "no reason given")
			.setTimestamp();

		channel.send(embed);
	}
}
