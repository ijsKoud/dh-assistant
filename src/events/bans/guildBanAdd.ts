import { Listener } from "discord-akairo";
import { User, MessageEmbed } from "discord.js";
import { modlog } from "../../client/config";
import { Guild } from "discord.js";

export default class guildBanAdd extends Listener {
	constructor() {
		super("guildBanAdd", {
			emitter: "client",
			event: "guildBanAdd",
			category: "client",
		});
	}

	async exec(guild: Guild, user: User) {
		const bans = await guild.fetchAuditLogs({ user, type: "MEMBER_BAN_ADD", limit: 100 });
		const ban = bans.entries.find(
			(b) => b.targetType === "USER" && (b.target as User).id === user.id
		);
		if (!ban) return;

		if (ban.executor.id === this.client.user.id) return;
		const channel = await this.client.utils.getChannel(modlog);
		channel.send(
			new MessageEmbed()
				.setColor("#DA5C59")
				.setAuthor(`🔨 Ban | ${user.tag}`)
				.setDescription(`Responsable moderator: ${ban.executor.toString()}`)
				.addField("• Reason", ban.reason.substr(0, 1024))
		);
	}
}
