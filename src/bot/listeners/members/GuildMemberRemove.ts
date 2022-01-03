import { ListenerOptions, Listener } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import type { GuildMember } from "discord.js";
import moment from "moment";

@ApplyOptions<ListenerOptions>({ once: false, event: "guildMemberRemove" })
export class GuildMemberRemoveListener extends Listener {
	public async run(member: GuildMember) {
		const { client } = this.container;
		if (member.guild.id !== client.constants.guild) return;
		if (member.partial) await member.fetch();

		const joinDate = client.utils.formatTime(moment(member.joinedTimestamp).unix(), "R");
		const embed = client.utils
			.embed()
			.setTitle(`Member joined: ${member.user.tag}`)
			.setDescription(
				[
					`>>> 👤 | **User**: **${member.user.tag}** (${member.toString()})`,
					`📅 | **Joined at**: ${joinDate}`,
					`🏷 | **roles**: ${client.utils
						.trimArray(
							member.roles.cache
								.sort((a, b) => b.position - a.position)
								.map((role) => role.toString())
								.slice(0, -1)
						)
						.join(", ")}`
				].join("\n")
			);
		client.loggingHandler.sendLogs(embed, "member");
		if (!member.pending) await member.roles.add(client.constants.roles.default).catch(() => void 0);

		const embed2 = client.utils
			.embed()
			.setColor("#DC5E55")
			.setAuthor({
				name: "Goodbye!"
			})
			.setTitle(`${member.user.tag} left the server!`)
			.setDescription("Bye bye 😢")
			.setFooter({ text: `There are now ${member.guild.memberCount} members in this server.` });

		client.loggingHandler.sendLogs(embed2, "join");
	}
}
