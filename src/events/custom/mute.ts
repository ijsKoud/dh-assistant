import { MessageEmbed, User, GuildMember } from "discord.js";
import { Listener } from "discord-akairo";
import { modlog } from "../../client/config";
import ms from "ms";

export default class mute extends Listener {
	constructor() {
		super("muteEvent", {
			event: "muteEvent",
			emitter: "client",
			category: "custom",
		});
	}

	async exec(
		type: "unmute" | "mute",
		member: GuildMember,
		moderator: User,
		reason: string,
		duration?: number
	) {
		if (member.guild.id !== process.env.GUILD) return;
		const channel = await this.client.utils.getChannel(modlog);
		const embed = new MessageEmbed();

		switch (type) {
			case "mute":
				embed
					.setColor("#F3884A")
					.setTitle(`🔇 Mute | ${member.user.tag}`)
					.setDescription([
						`Responsable moderator: ${moderator.toString()}`,
						`Duration: ${ms(duration, { long: true })}`,
					])
					.addField("• Reason", reason.substr(0, 1024));
				break;

			case "unmute":
				embed
					.setColor("#4AF3AB")
					.setTitle(`🔊 Unmute | ${member.user.tag}`)
					.setDescription([`Responsable moderator: ${moderator.toString()}`])
					.addField("• Reason", reason.substr(0, 1024));
				break;
		}

		channel.send(embed);
	}
}
