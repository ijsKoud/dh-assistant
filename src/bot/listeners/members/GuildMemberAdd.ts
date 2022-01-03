import { ListenerOptions, Listener } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import type { GuildMember } from "discord.js";
import moment from "moment";

@ApplyOptions<ListenerOptions>({ once: false, event: "guildMemberAdd" })
export class GuildMemberAddListener extends Listener {
	public async run(member: GuildMember) {
		const { client } = this.container;
		if (member.guild.id !== client.constants.guild) return;
		if (member.partial) await member.fetch();

		const embed = client.utils
			.embed()
			.setTitle(`Member joined: ${member.user.tag}`)
			.setDescription(
				[
					`>>> 👤 | **User**: ${member.user.tag} (${member.toString()})`,
					`🗓 | **Created at**: ${client.utils.formatTime(moment(member.user.createdTimestamp).unix(), "F")} | ${client.utils.formatTime(
						moment(member.user.createdTimestamp).unix(),
						"R"
					)}`
				].join("\n")
			);
		client.loggingHandler.sendLogs(embed, "member");
		if (!member.pending) await member.roles.add(client.constants.roles.default).catch(() => void 0);

		const general = await client.utils.getChannel(client.constants.channels.general);
		if (general && general.isText()) await general.send(`**${member.user.tag}** just joined! Make sure to welcome them!`).catch(() => void 0);

		const embed2 = client.utils
			.embed()
			.setColor("#58DCAE")
			.setTitle(`Welcome to Draavo's Hangout, ${member.user.tag}`)
			.setDescription(`There are now **${member.guild.memberCount}** members in this server. Don't forget to say hi!`)
			.setFooter({ text: "Daan has left a message for you: say Hi!", iconURL: "https://static.daangamesdg.xyz/discord/pfp.gif" });
		client.loggingHandler.sendLogs(embed2, "join");
	}
}
