import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Mute from "../../models/mute";
import { muteRole } from "../../client/config";

export default class unmute extends Command {
	constructor() {
		super("unmute", {
			aliases: ["unmute"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_ROLES"],
			description: {
				content: "unmute a user",
				usage: "unmute <user> [reason]",
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

		if (!user) return message.util.send(`>>> 🔎 | I didn't find a user called "${userId}".`);

		const mute = await Mute.findOne({
			id: user.id,
			guildId: message.guild.id,
		});
		if (!mute) return message.util.send(`>>> ${redtick} | This user isn't muted in this server.`);

		if (mute) mute.delete();

		const member = await this.client.util.fetchMember(message.guild, user.id, true);
		if (member)
			await member.roles.remove(muteRole).catch((e) => {
				return message.util.send(
					`> ${this.client.utils.emojiFinder(
						"warning"
					)} | Oops, Discord threw an exception: \`${e}\`.`
				);
			});

		this.client.emit("muteEvent", "unmute", member, message.author, reason);
		return message.util.send(
			`>>> 🔊 | Successfully unmuted **${member.user.tag}**, reason: **${reason}**.`,
			{ split: true }
		);
	}
}
