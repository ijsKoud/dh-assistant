import { Message, MessageEmbed } from "discord.js";
import { Command } from "discord-akairo";
import tempban from "../../models/tempban";
import { modlog } from "../../client/config";

export default class unban extends Command {
	constructor() {
		super("unban", {
			aliases: ["unban"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["BAN_MEMBERS"],
			clientPermissions: ["BAN_MEMBERS"],
			description: {
				content: "Unban a user from the guild",
				usage: "unban <user> [reason]",
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

	async exec(message: Message, { userId, reason }: { userId: string; reason: string }) {
		const redtick = this.client.utils.emojiFinder("redtick");
		const user = await this.client.utils.fetchUser(userId);
		let banned: boolean = true;

		if (!user) return message.util.send(`> 🔎 | I didn't find a user called "${userId}".`);

		await message.guild.fetchBan(user).catch((e) => (banned = false));
		if (!banned)
			return message.util.send(`>>> ${redtick} | This user isn't banned in this server.`);

		const ban = await tempban.findOne({
			id: user.id,
			guildId: message.guild.id,
		});
		if (ban) ban.delete();

		await message.guild.members.unban(user, `${message.author.id}|${reason}`).catch((e) => {
			return message.util.send(
				`> ${this.client.utils.emojiFinder(
					"warning"
				)} | Oops, Discord threw an exception: \`${e}\`.`
			);
		});

		const channel = await this.client.utils.getChannel(modlog);
		channel.send(
			new MessageEmbed()
				.setColor("#4AF3AB")
				.setAuthor(`🔨 Unban | ${user.tag}`)
				.setDescription(`Responsable moderator: ${message.author.toString()}`)
				.addField("• Reason", reason.substr(0, 1024))
		);

		return message.util.send(
			`> 🔨 | Successfully unbanned **${user.tag}**, reason: **${reason}**.`,
			{ split: true }
		);
	}
}
