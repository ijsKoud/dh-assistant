import { Message, MessageEmbed } from "discord.js";
import { Command } from "discord-akairo";
import { modlog, systemLogPublic } from "../../client/config";
import ms from "ms";
import Tempban from "../../models/tempban";

export default class tempban extends Command {
	constructor() {
		super("tempban", {
			aliases: ["tempban"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["BAN_MEMBERS"],
			clientPermissions: ["BAN_MEMBERS"],
			description: {
				content: "Tempan someone from inside or outside the guild.",
				usage: "tempban <user> [reason]",
			},
			cooldown: 1e3,
			args: [
				{
					id: "userId",
					type: "string",
					match: "phrase",
				},
				{
					id: "duration",
					type: "string",
					default: () => "1d",
				},
				{
					id: "reason",
					type: "string",
					match: "rest",
					default: () => "No reason given.",
				},
				{
					id: "anonymous",
					type: ["true", "false"],
					match: "option",
					flag: "-a=",
					default: () => "false",
				},
			],
		});
	}

	async exec(
		message: Message,
		{
			userId,
			duration,
			reason,
			anonymous,
		}: { userId: string; duration: string; reason: string; anonymous: string }
	) {
		const redtick = this.client.utils.emojiFinder("greentick");
		const user = await this.client.utils.fetchUser(userId || "");
		const dur = ms(duration);
		if (!user) return message.util.send(">>> 🔎 | I was unable to find this user on discord.");

		if (user.id === message.author.id)
			return message.util.send(">>> ❓ | Why do you want to tempban yourself?!");
		if (user.id === this.client.user.id)
			return message.util.send(">>> 😢 | After all the hard work, you still want to tempban me?");
		if (user.id === message.guild.ownerID)
			return message.util.send(">>> 👑 | Why do you want to tempban the owner? You can't do that!");

		const member = await this.client.util.fetchMember(message.guild, user.id, true);
		let DMed: boolean = false;

		if (member) {
			if (
				member.roles.highest.position >= message.member.roles.highest.position &&
				message.guild.ownerID !== message.author.id
			)
				return message.util.send(
					`>>> ${redtick} | You cannot tempban this user due to role hierarchy.`
				);
			if (!member.bannable)
				return message.util.send(`>>> ${redtick} | I cannot ban this user due to role hierarchy.`);

			DMed = true;
			await member
				.send(
					`>>> 🔨 | **Temporarily Banned - Draavo's Hangout**\n📃 | Reason: **${reason}**\n⌚ | Duration: \`${ms(
						dur
					)}\`\n\n🙏 | **Want to appeal?**\nClick on this link to appeal: https://forms.gle/RMT5X7gcYh6iuPqM6`,
					{ split: true }
				)
				.catch((e) => (DMed = false));
		}

		await message.guild.members.ban(user, { reason }).catch((e) => {
			return message.util.send(
				`> ${this.client.utils.emojiFinder(
					"warning"
				)} | Oops, Discord threw an exception: \`${e}\`.`
			);
		});

		await new Tempban({
			guildId: message.guild.id,
			moderator: message.author.id,
			id: user.id,
			endDate: Date.now() + dur,
			duration: dur,
		})
			.save()
			.catch((e) => {
				return message.channel.send(
					`> ${this.client.utils.emojiFinder(
						"warning"
					)} | Oops, mongodb threw an exception: \`${e}\`.`
				);
			});

		const channel = await this.client.utils.getChannel(modlog);
		const system = await this.client.utils.getChannel(systemLogPublic);
		if ((anonymous || "false").toLowerCase() !== "true")
			system.send(
				new MessageEmbed()
					.setAuthor("The ban hammer has come down!")
					.setTitle(`${user.tag} has been banned!`)
					.setDescription(`That is one big oof there, don't you think? 🔨`)
					.setFooter(`There are now ${message.guild.memberCount} members in this server.`)
					.setColor("BLACK")
			);
		channel.send(
			new MessageEmbed()
				.setColor("#FD6CE1")
				.setAuthor(`🔨 tempBan | ${user.tag}`)
				.setDescription(`Responsable moderator: ${message.author.toString()}\nDuration: ${ms(dur)}`)
				.addField("• Reason", reason.substr(0, 1024))
		);

		return message.util.send(
			`>>>🔨 | Successfully tempbanned **${user.tag}** for **${reason}**, duration: ${ms(dur)}. ${
				DMed ? "" : "\n > ℹ | **I couldn't DM this user**"
			}`,
			{ split: true }
		);
	}
}
