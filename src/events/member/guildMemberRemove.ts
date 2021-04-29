import { GuildMember, MessageEmbed } from "discord.js";
import { Listener } from "discord-akairo";
import Logs from "../../models/logging/Logs";
import moment from "moment";

export default class guildMemberRemoveListener extends Listener {
	constructor() {
		super("guildMemberRemove", {
			emitter: "client",
			event: "guildMemberRemove",
		});
	}

	async exec(member: GuildMember) {
		try {
			if (member.partial) member.user = await member.user.fetch();

			const kick = await Logs.findOne({
				guildId: member.guild.id,
				userId: member.id,
				type: "kick",
			});
			if (!kick) return this.log(member);

			await this.log(member, true);
			await kick.delete();
			const moderator = await this.client.utils.fetchUser(kick.moderator);
			await this.client.loggingHandler.kick(member.user, moderator, kick);
		} catch (e) {
			this.client.log("ERROR", `guildMemberRemove error: \`\`\`${e.stack || e.message}\`\`\``);
		}
	}

	async log(member: GuildMember, kicked: boolean = false) {
		if (member.guild.id !== "701781652577321002") return;

		const channel = await this.client.utils.getChannel("764191400451244053");
		const joinDate = moment(member.joinedTimestamp).fromNow();

		await channel.send(
			new MessageEmbed()
				.setColor("#FFF4B4")
				.setTitle("Member left: " + member.user.tag)
				.setDescription([
					`>>> 👤 | **User**: **${member.user.tag}** (${member.toString()})`,
					`📅 | **Joined at**: ${joinDate}`,
					`🏷 | **roles**: ${this.client.utils
						.trimArray(
							member.roles.cache
								.sort((a, b) => b.position - a.position)
								.map((role) => role.toString())
								.slice(0, -1)
						)
						.join(", ")}`,
				])
		);

		const publicLogs = await this.client.utils.getChannel("701792628844527697");
		if (!kicked)
			await publicLogs.send(
				new MessageEmbed()
					.setColor("#DC5E55")
					.setAuthor("Goodbye!")
					.setTitle(`${member.user.tag} left the server!`)
					.setDescription(`Bye bye 😢`)
					.setFooter(`There are now ${member.guild.memberCount} members in this server.`)
			);
	}
}
