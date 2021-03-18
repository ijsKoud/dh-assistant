import { Guild, GuildMember, User } from "discord.js";
import { Listener } from "discord-akairo";
import { MessageEmbed } from "discord.js";

export default class guildBanRemoveEvent extends Listener {
	constructor() {
		super("guildBanRemove", {
			emitter: "client",
			event: "guildBanRemove",
		});
	}

	async exec(guild: Guild, user: User) {
		if (guild.id !== process.env.GUILD) return;
		const bans = await guild.fetchAuditLogs({ type: "MEMBER_BAN_REMOVE", limit: 100 });
		if (!bans?.entries?.size) return this.client.log("WARN", `No ban found`);

		const ban = bans.entries.find(
			(b) => b.targetType === "USER" && (b.target as GuildMember).id === user.id
		);
		if (!ban) return;

		const embed = new MessageEmbed()
			.setColor(this.client.colours.green)
			.setTitle(`User unbanned - ${guild.name}`)
			.setFooter("User unbanned")
			.setTimestamp();
		const description = [`**Offender**: ${user.tag} (${user.toString()})`];
		switch (ban.executor?.id) {
			case this.client.user.id:
				{
					const [userId, reason] = ban.reason?.split(/\|/g) || [
						this.client.user.id,
						"no reason given",
					];

					const member = await this.client.utils.fetchMember(userId, guild);
					description.push(`**Moderator**: ${member.user.tag} (${member.toString()})`);
					embed.addField("- Reason:", reason.substr(0, 1024) || "no reason given");
				}
				break;
			default:
				{
					const member = await this.client.utils.fetchMember(ban.executor.id, guild);
					description.push(`**Moderator**: ${member.user.tag} (${member.toString()})`);
					embed.addField("- Reason:", ban.reason?.substr(0, 1024) || "no reason given");
				}
				break;
		}

		embed.setDescription(description);
		const channel = await this.client.utils.getChannel(this.client.config.modlog);
		channel.send(embed);
	}
}
