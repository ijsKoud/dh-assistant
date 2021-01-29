import { Command } from "discord-akairo";
import { Message, MessageEmbed } from "discord.js";
import moment from "moment";
import fetch from "node-fetch";
import { KSoftClient } from "@ksoft/api";
import { DRepClient } from "@aero/drep";
import { GuildMember } from "discord.js";

const ksoft = new KSoftClient(process.env.KSOFT_TOKEN);
const drep = new DRepClient(process.env.DREP_TOKEN);

const robloxApi = "https://api.roblox.com/";
const baseURL = "https://api.blox.link/v1/user/";

interface Reputation {
	upvotes: number;
	downvotes: number;
	reputation: number;
	rank: string;
	xp: number;
	staff: boolean;
}

export default class info extends Command {
	public constructor() {
		super("info", {
			aliases: ["info", "userinfo"],
			category: "General",
			description: {
				content: "Shows you the user information of someone.",
				usage: "info [user]",
			},
			cooldown: 2e3,
			args: [
				{
					id: "userId",
					type: "string",
					match: "phrase",
				},
			],
		});
	}

	async exec(message: Message, { userId }: { userId: string }) {
		const embed = new MessageEmbed();
		const user = (await this.client.utils.fetchUser(userId)) || message.author;

		message.channel.startTyping();

		let robloxAccount: any;
		try {
			const data = await (await fetch(baseURL + user.id)).json();
			robloxAccount = data.primaryAccount
				? await (await fetch(robloxApi + "users/" + data.primaryAccount)).json()
				: null;
		} catch (e) {
			robloxAccount = { Username: "uknown" };
		}
		const rep: Reputation = await drep.rep(user.id);
		const banned = await ksoft.bans.check(user.id);

		embed
			.setColor("#48B782")
			.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 4096 }))
			.addField("• Global User Statistics", [
				`> 🤔 | **Reputation**: ${rep.upvotes - rep.downvotes < 0 ? "bad" : "good"}`,
				`> 🔨 | **Globally banned**: ${banned ? "🔨" : this.client.utils.emojiFinder("redtick")}`,
				`> ⚖ | **Conclusion**: ${
					rep.upvotes - rep.downvotes < 0 || banned ? "untrustable" : "trustable"
				}`,
			])
			.addField("• General Information", [
				`> 👤 | **User**: ${user.toString()}`,
				`> ${this.client.utils.emojiFinder("idcard")} | **User ID**: \`${user.id}\``,
				`> 📆 | **Created at**: \`${moment(user.createdTimestamp).format(
					"MMMM Do YYYY hh:mm:ss"
				)} | ${moment(user.createdTimestamp).fromNow()}\``,
				`> 🎮 | **Roblox Account**: \`${robloxAccount ? robloxAccount.Username : "none"}\``,
			])
			.setFooter("The global stats may not be 100% correct - apis: discordrep & KSoft Ban");

		const member: GuildMember = message.guild
			? await this.client.util.fetchMember(message.guild, user.id).catch((e) => null)
			: null;
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

			embed.setColor(member.displayHexColor || "#48B782");
			embed.addField("• Member Information", [
				`> 📆 | **Joined at**: \`${moment(member.joinedTimestamp).format(
					"MMMM Do YYYY hh:mm:ss"
				)} | ${moment(member.joinedTimestamp).fromNow()}\``,
				`> 📂 | **Roles**: ${roles}`,
			]);
		}

		message.channel.send(embed);
		message.channel.stopTyping(true);
	}
}
