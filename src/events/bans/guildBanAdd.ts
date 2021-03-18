import { Guild, GuildMember, User } from "discord.js";
import { Listener } from "discord-akairo";
import { MessageEmbed } from "discord.js";
import Ban from "../../model/moderation/Ban";
import ms from "ms";

export default class guildBanAddEvent extends Listener {
	constructor() {
		super("guildBanAdd", {
			emitter: "client",
			event: "guildBanAdd",
		});
	}

	async exec(guild: Guild, user: User) {
		if (guild.id !== process.env.GUILD) return;
		const bans = await guild.fetchAuditLogs({ type: "MEMBER_BAN_ADD", limit: 100 });
		if (!bans?.entries?.size) return this.client.log("WARN", `No ban found`);

		const ban = bans.entries.find(
			(b) => b.targetType === "USER" && (b.target as GuildMember).id === user.id
		);
		if (!ban) return;

		const embed = new MessageEmbed()
			.setColor(this.client.colours.red)
			.setTitle(`User banned - ${guild.name}`)
			.setFooter("User banned")
			.setTimestamp();
		const description = [`**Offender**: ${user.tag} (${user.toString()})`];
		switch (ban?.executor?.id) {
			case this.client.user.id:
				{
					const [userId, reason] = ban.reason?.split(/\|/g) || [
						this.client.user.id,
						"no reason given",
					];

					const tempBan = await Ban.findOne({ userId: user.id, guildId: guild.id });
					if (tempBan) {
						const member = await this.client.utils.fetchMember(tempBan.moderator, guild);
						description.push(
							`**Moderator**: ${member.user.tag} (${member.toString()})`,
							`**Duration**: \`${ms(tempBan.duration, { long: true })}\``
						);
						embed.addField("- Reason:", reason.substr(0, 1024) || "no reason given");
						embed.setColor(this.client.colours.pink);
						embed.setTitle(embed.title.replace("banned", "tempbanned"));
					} else {
						const member = await this.client.utils.fetchMember(userId, guild);
						description.push(`**Moderator**: ${member.user.tag} (${member.toString()})`);
						embed.addField("- Reason:", reason.substr(0, 1024) || "no reason given");
					}
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
