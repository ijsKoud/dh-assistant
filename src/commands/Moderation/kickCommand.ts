import { Message } from "discord.js";
import { Command } from "discord-akairo";
import { modlog, systemLogPublic } from "../../client/config";
import { MessageEmbed } from "discord.js";
import { GuildMember } from "discord.js";

export default class kick extends Command {
	constructor() {
		super("kick", {
			aliases: ["kick"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["KICK_MEMBERS"],
			clientPermissions: ["KICK_MEMBERS"],
			description: {
				content: "Kick someone from the guild",
				usage: "kick <user> [reason]",
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
			],
		});
	}

	async exec(
		message: Message,
		{ userId, reason }: { userId: string; reason: string; anonymous: string }
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

		if (!member)
			return message.util.send(">>> 🔎 | I can not kick a user if they aren't in this server.");
		if (
			member.roles.highest.position >= message.member.roles.highest.position &&
			message.guild.ownerID !== message.author.id
		)
			return message.util.send(`>>> ${redtick} | You cannot ban this user due to role hierarchy.`);
		if (!member.bannable)
			return message.util.send(`>>> ${redtick} | I cannot ban this user due to role hierarchy.`);

		DMed = true;
		await member
			.send(
				`>>> 👞 | **Kicked - Draavo's Hangout**\n📃 | Reason: **${reason}**\n\n👋 | **Want to join back?**\nMake sure to follow the rules and listen to the staff members! http://www.draavo.cf/discord`,
				{ split: true }
			)
			.catch((e) => (DMed = false));

		await member.kick(`${reason}`).catch((e) => {
			return message.channel.send(
				`>>> ${this.client.utils.emojiFinder(
					"warning"
				)} | Oops, Discord threw an exception: \`${e}\`.`
			);
		});

		const channel = await this.client.utils.getChannel(modlog);
		channel.send(
			new MessageEmbed()
				.setColor("#4C8CFB")
				.setAuthor(`👞 Kick | ${user.tag}`)
				.setDescription(`Responsable moderator: ${message.author.toString()}`)
				.addField("• Reason", reason.substr(0, 1024))
		);

		return message.util.send(
			`>>> 👞 | Successfully kicked **${member.user.tag}** for **${reason}**. ${
				DMed ? "" : "\nℹ | **I couldn't DM this user**"
			}`,
			{ split: true }
		);
	}
}
