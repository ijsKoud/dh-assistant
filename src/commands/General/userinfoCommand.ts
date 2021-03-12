import { Message } from "discord.js";
import { Command } from "discord-akairo";
import { MessageEmbed } from "discord.js";
import { KSoftClient } from "@ksoft/api";
import { DRepClient } from "@aero/drep";
import moment from "moment";

const ksoft = new KSoftClient(process.env.KSOFT_TOKEN);
const drep = new DRepClient(process.env.DREP_TOKEN);

interface Reputation {
	upvotes: number;
	downvotes: number;
	reputation: number;
	rank: string;
	xp: number;
	staff: boolean;
}

export default class userinfoCommand extends Command {
	constructor() {
		super("userInfo", {
			aliases: ["userinfo", "info", "uinfo"],
			description: {
				content: "Gathers all info for the provided user",
				usage: "userinfo [user]",
			},
			args: [
				{
					id: "id",
					type: "string",
					default: (m: Message) => m.author.id,
				},
			],
		});
	}

	async exec(message: Message, { id }: { id: string }) {
		const user = (await this.client.utils.fetchUser(id)) || message.author;
		const embed = new MessageEmbed()
			.setColor(this.client.hex)
			.setAuthor(`${user.tag} - user info`, user.displayAvatarURL({ dynamic: true, size: 4096 }));

		message.channel.startTyping();
		const rep: Reputation = await drep.rep(user.id);
		const banned = await ksoft.bans.check(user.id);
		const roblox = await user.robloxUser();

		embed
			.setColor(this.client.hex)
			.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 4096 }))
			.addField("• Global User Statistics", [
				`> 🤔 | **Reputation**: ${rep.upvotes - rep.downvotes < 0 ? "bad" : "good"}`,
				`> 🔨 | **Globally banned**: ${banned ? "🔨" : this.client.utils.emojiFinder("redtick")}`,
				`> ⚖ | **Conclusion**: ${
					rep.upvotes - rep.downvotes < 0 || banned ? "untrustable" : "trustable"
				}`,
			])
			.addField("• General Information", [
				`> 👤 | **User**: ${user.tag} (${user.toString()})`,
				`> ${this.client.utils.emojiFinder("idcard")} | **User ID**: \`${user.id}\``,
				`> 📆 | **Created at**: \`${moment(user.createdTimestamp).format(
					"MMMM Do YYYY hh:mm:ss"
				)} | ${moment(user.createdTimestamp).fromNow()}\``,
			])
			.addField("• Roblox Information", [
				`>>> 🎮 | **Rover**: ${roblox.rover || "-"}`,
				`🕹 | **Bloxlink**: ${roblox.bloxlink || "-"}`,
			])
			.setFooter("The global stats are fetched from an api - discordrep & KSoft Ban");

		if (message.guild) {
			const member = await this.client.utils.fetchMember(user.id, message.guild);
			if (member) {
				const r = member.roles.cache
					.sort((a, b) => b.position - a.position)
					.map((role) => role.toString())
					.slice(0, -1);

				const roles =
					r.length < 10
						? r.map((role) => role.toString()).join(", ")
						: r.length > 10
						? this.client.utils.trimArray(r).join(", ")
						: "none";

				embed.setColor(member.displayHexColor || this.client.hex);
				embed.addField("• Member Information", [
					`> 📆 | **Joined at**: \`${moment(member.joinedTimestamp).format(
						"MMMM Do YYYY hh:mm:ss"
					)} | ${moment(member.joinedTimestamp).fromNow()}\``,
					`> 📂 | **Roles**: ${roles}`,
				]);
			}
		}

		message.channel.send(embed);
		message.channel.stopTyping(true);
	}
}
