import { Message, GuildMember } from "discord.js";
import { Command } from "discord-akairo";
import { modlog, systemLogPublic } from "../../client/config";
import { MessageEmbed } from "discord.js";

export default class ban extends Command {
	constructor() {
		super("ban", {
			aliases: ["ban", "hammer"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["BAN_MEMBERS"],
			clientPermissions: ["BAN_MEMBERS"],
			description: {
				content: "Ban someone from inside or outside the guild.",
				usage: "ban <user> [reason]",
			},
			cooldown: 1e3,
			args: [
				{
					id: "userId",
					type: "string",
					match: "phrase",
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
		{ userId, reason, anonymous }: { userId: string; reason: string; anonymous: string }
	) {
		const redtick = this.client.utils.emojiFinder("greentick");
		const user = await this.client.utils.fetchUser(userId || "");
		if (!user) return message.util.send(">>> 🔎 | I was unable to find this user on discord.");

		if (user.id === message.author.id)
			return message.util.send(">>> ❓ | Why do you want to ban yourself?!");
		if (user.id === this.client.user.id)
			return message.util.send(">>> 😢 | After all the hard work, you still want to ban me?");
		if (user.id === message.guild.ownerID)
			return message.util.send(">>> 👑 | Why do you want to ban the owner? You can't do that!");

		const member: GuildMember = await this.client.util
			.fetchMember(message.guild, user.id, true)
			.catch((e) => null);
		let DMed: boolean = false;

		if (member) {
			if (
				member.roles.highest.position >= message.member.roles.highest.position &&
				message.guild.ownerID !== message.author.id
			)
				return message.util.send(
					`>>> ${redtick} | You cannot ban this user due to role hierarchy.`
				);
			if (!member.bannable)
				return message.util.send(`>>> ${redtick} | I cannot ban this user due to role hierarchy.`);

			DMed = true;
			await member
				.send(
					`>>> 🔨 | **Permanent Banned - Draavo's Hangout**\n📃 | Reason: **${reason}**\n\n🙏 | **Want to appeal?**\nClick on this link to appeal: https://forms.gle/RMT5X7gcYh6iuPqM6`,
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
				.setColor("#DA5C59")
				.setAuthor(`🔨 Ban | ${user.tag}`)
				.setDescription(`Responsable moderator: ${message.author.toString()}`)
				.addField("• Reason", reason.substr(0, 1024))
		);

		return message.util.send(
			`>>> 🔨 | Successfully banned **${user.tag}** for **${reason}**. ${
				DMed ? "" : "\nℹ | **I couldn't DM this user**"
			}`,
			{ split: true }
		);
	}
}
