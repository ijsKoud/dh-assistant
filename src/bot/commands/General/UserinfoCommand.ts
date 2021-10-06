import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Message } from "discord.js";
import { Args } from "@sapphire/framework";
import axios from "axios";
import moment from "moment";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "info",
	aliases: ["userinfo", "uinfo"],
	description: "Shows you the information about a user",
	usage: "[user]",
	requiredClientPermissions: ["EMBED_LINKS"],
})
export default class ServerinfoCommand extends Command {
	public async run(message: Message, args: Args): Promise<void> {
		const msg = await message.reply(`>>> ${emojis.loading} | Getting user information...`);

		let { value: user } = await args.pickResult("user");
		if (!user) user = message.author;

		const embed = this.client.utils
			.embed()
			.setAuthor(`${user.tag} - user info`, user.displayAvatarURL({ dynamic: true, size: 4096 }));

		const { data: rep } = await axios
			.get<Reputation>(
				`https://discordrep.com/api/v3/rep/${user.id}`,
				this.getHeaders(true, "DREP_TOKEN")
			)
			.catch(() => ({
				data: {
					upvotes: 0,
					downvotes: 0,
					reputation: 0,
					rank: 0,
					xp: 0,
					staff: false,
				},
			}));

		const { data: banned } = await axios
			.get<KsoftBan>(
				`https://api.ksoft.si/bans/check?user=${user.id}`,
				this.getHeaders(true, "KSOFT_TOKEN")
			)
			.catch(() => ({
				data: {
					upvotes: 0,
					downvotes: 0,
					reputation: 0,
					rank: 0,
					xp: 0,
					staff: false,
				},
			}));

		const roblox = await this.client.utils.robloxUser(user.id);

		embed
			.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 4096 }))
			.addField(
				"• Global User Statistics",
				[
					`> 🤔 | **Reputation**: ${rep.upvotes - rep.downvotes < 0 ? "bad" : "good"}`,
					`> 🔨 | **Globally banned**: ${banned ? "🔨" : emojis.redcross}`,
					`> ⚖ | **Conclusion**: ${
						rep.upvotes - rep.downvotes < 0 || banned ? "untrustable" : "trustable"
					}`,
				].join("\n")
			)
			.addField(
				"• General Information",
				[
					`> 👤 | **User**: ${user.tag} (${user.toString()})`,
					`> 🥽 | **User ID**: \`${user.id}\``,
					`> 📆 | **Created at**: ${this.client.utils.formatTime(
						moment(user.createdTimestamp).unix(),
						"f"
					)} | ${this.client.utils.formatTime(moment(user.createdTimestamp).unix(), "R")}`,
				].join("\n")
			)
			.addField(
				"• Roblox Information",
				[
					`>>> 🎮 | **Rover**: ${roblox.rover || "-"}`,
					`🕹 | **Bloxlink**: ${roblox.bloxlink || "-"}`,
				].join("\n")
			)
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

				embed.setColor(member.displayHexColor || process.env.COLOUR);
				embed.addField(
					"• Member Information",
					[
						`> 📆 | **Joined at**: ${this.client.utils.formatTime(
							moment(member.joinedTimestamp ?? 0).unix(),
							"f"
						)} | ${this.client.utils.formatTime(moment(member.joinedTimestamp ?? 0).unix(), "R")}`,
						`> 📂 | **Roles**: ${roles}`,
					].join("\n")
				);
			}
		}

		await msg.edit({
			embeds: [embed],
			content: null,
		});
	}

	private getHeaders(bearer: boolean, key: string) {
		return {
			headers: {
				Authorization: `${bearer ? "Bearer " : ""}${process.env[key]}`,
			},
		};
	}
}

interface Reputation {
	upvotes: number;
	downvotes: number;
	reputation: number;
	rank: string;
	xp: number;
	staff: boolean;
}

export interface KsoftBan {
	is_banned: boolean;
}
