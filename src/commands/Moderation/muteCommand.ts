import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Mute from "../../models/mute";
import { muteRole } from "../../client/config";
import ms from "ms";

export default class mute extends Command {
	constructor() {
		super("mute", {
			aliases: ["mute"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_ROLES"],
			description: {
				content: "mute a user",
				usage: "mute <user> [reason]",
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
		{ userId, duration, reason }: { userId: string; duration: string; reason: string }
	) {
		const redtick = this.client.utils.emojiFinder("redtick");
		const user = await this.client.utils.fetchUser(userId);

		const dur = ms(duration);

		if (!user) return message.util.send(`>>> 🔎 | I didn't find a user called "${userId}".`);
		if (user.id === message.author.id)
			return message.util.send("> ❓ | Why do you want to mute yourself?!");
		if (user.id === this.client.user.id)
			return message.util.send(">>> 😢 | After all the hard work, you still want to mute me?");
		if (user.id === message.guild.ownerID)
			return message.util.send(">>> 👑 | Why do you want to mute the owner? You can't do that!");

		let DMed: boolean = false;

		const member = await this.client.util.fetchMember(message.guild, user.id, true);
		if (member) {
			if (
				member.roles.highest.position >= message.member.roles.highest.position &&
				message.guild.ownerID !== message.author.id
			)
				return message.util.send(
					`>>> ${redtick} | You cannot mute this user due to role hierarchy.`
				);
			if (!member.manageable)
				return message.util.send(`>>> ${redtick} | I cannot mute this user due to role hierarchy.`);

			DMed = true;
			await member
				.send(
					`>>> 🔇 | **Muted - Draavo's Hangout**\n⌚ | Duration: \`${ms(
						dur
					)}\`\n📃 | Reason: **${reason}**\n\n🙏 | **Want to appeal?** \n Create a ticket with the topic: \`mute appeal\`.`,
					{ split: true }
				)
				.catch((e) => (DMed = false));
		}

		await new Mute({
			guildId: message.guild.id,
			moderator: message.author.id,
			id: member.id,
			endDate: Date.now() + dur,
			duration: dur,
		})
			.save()
			.catch((e) => {
				return message.util.send(
					`>>> ${this.client.utils.emojiFinder(
						"warning"
					)} | Oops, mongodb threw an exception: \`${e}\`.`
				);
			});

		await member.roles.add(muteRole, `${message.author.id}|${reason}`).catch((e) => {
			return message.util.send(
				`>>> ${this.client.utils.emojiFinder(
					"warning"
				)} | Oops, Discord threw an exception: \`${e}\`.`
			);
		});

		this.client.emit("muteEvent", "mute", member, message.author, reason, duration);

		return message.util.send(
			`>>> 🔇 | Successfully muted **${
				member.user.tag
			}** for **${reason}**, duration of mute: \`${ms(duration)}\`. ${
				DMed ? "" : "\nℹ | **I couldn't DM this user**"
			}`,
			{ split: true }
		);
	}
}
