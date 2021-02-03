import { Listener } from "discord-akairo";
import { User, MessageEmbed } from "discord.js";
import { modlog } from "../../client/config";
import { Guild } from "discord.js";

export default class guildBanRemove extends Listener {
	constructor() {
		super("guildBanRemove", {
			emitter: "client",
			event: "guildBanRemove",
			category: "client",
		});
	}

	async exec(guild: Guild, user: User) {
		if (guild.id !== process.env.GUILD) return;
		const unbans = await guild.fetchAuditLogs({ user, type: "MEMBER_BAN_REMOVE", limit: 100 });
		const unban = unbans.entries.find(
			(b) => b.targetType === "USER" && (b.target as User).id === user.id
		);
		if (!unban) return;

		if (unban.executor.id === this.client.user.id) return;
		const channel = await this.client.utils.getChannel(modlog);
		channel.send(
			new MessageEmbed()
				.setColor("#4AF3AB")
				.setAuthor(`🔨 unban | ${user.tag}`)
				.setDescription(`Responsable moderator: ${unban.executor.toString()}`)
				.addField("• Reason", unban.reason.substr(0, 1024))
		);
	}
}
