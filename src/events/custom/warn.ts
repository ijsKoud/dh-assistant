import { MessageEmbed, User } from "discord.js";
import { Listener } from "discord-akairo";
import { modlog, muteRole } from "../../client/config";
import Warn from "../../models/warn";
import mute from "../../models/mute";

export default class warn extends Listener {
	constructor() {
		super("warnEvent", {
			event: "warnEvent",
			emitter: "client",
			category: "custom",
		});
	}

	async exec(user: User, moderator: User, caseId: string, reason: string) {
		const channel = await this.client.utils.getChannel(modlog);
		channel.send(
			new MessageEmbed()
				.setColor("#FFF68B")
				.setTitle(`📓 Warn | ${user.tag}`)
				.setDescription(`Responsable moderator: ${moderator.toString()}\nCase id: ${caseId}`)
				.addField("• Reason", reason.substr(0, 1024))
		);

		const warningCount = await Warn.find({
			id: user.id,
			guildId: channel.guild.id,
		});

		const member = await this.client.util.fetchMember(channel.guild, user.id, true);
		if (warningCount.length % 2 === 0) {
			const r = `Automatic mute after ${warningCount.length} warnings`;
			await new mute({
				guildId: member.guild.id,
				moderator: this.client.user.id,
				id: user.id,
				endDate: Date.now() + 6e5,
				duration: 6e5,
			}).save();

			member.roles.add(muteRole);

			this.client.emit("muteEvent", "mute", member, this.client.user, r, 6e5);
		}
	}
}
