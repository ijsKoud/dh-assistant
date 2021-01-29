import { Message, GuildMember } from "discord.js";
import { Command } from "discord-akairo";
import Warn from "../../models/warn";

export default class warn extends Command {
	constructor() {
		super("warn", {
			aliases: ["warn"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			description: {
				content: "Warn someone using the bot",
				usage: "warn <user> [reason]",
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
		const user = await this.client.utils.fetchUser(userId || "");
		const redtick = this.client.utils.emojiFinder("redtick");
		if (!user) return this.client.emit("missingArg", message, ["<user>", "[reason]"]);

		const member: GuildMember = await this.client.util
			.fetchMember(message.guild, user.id, true)
			.catch((e) => null);

		if (!member) return message.util.send(`> 🔎 | I didn't find a user called "${userId}".`);
		if (member.id === message.author.id)
			return message.util.send("> ❓ | Why do you want to warn yourself?!");
		if (member.id === this.client.user.id)
			return message.util.send("> 😢 | After all the hard work, you still want to warn me?");
		if (member.id === message.guild.ownerID)
			return message.util.send("> 👑 | Why do you want to warn the owner? You can't do that!");

		let DMed: boolean = false;

		if (member) {
			if (
				member.roles.highest.position >= message.member.roles.highest.position &&
				message.guild.ownerID !== message.author.id
			)
				return message.util.send(`> ${redtick} | You cannot warn this user due to role hierarchy.`);

			DMed = true;
			await member
				.send(
					`>>> 🧾 | **Warned - ${message.guild.name}**\n📃 | Reason: **${reason}**\n\n🙏 | **Want to appeal?** \n Create a ticket with the topic: \`warn appeal\`.`,
					{ split: true }
				)
				.catch((e) => (DMed = false));
		}

		const caseId = `#${(await Warn.find({ guildId: message.guild.id })).length + 1}`;
		await new Warn({
			id: member.id,
			guildId: message.guild.id,
			moderator: message.author.id,
			reason: reason,
			case: caseId,
			date: Date.now(),
		})
			.save()
			.catch((e) => {
				return message.util.send(
					`> ${this.client.utils.emojiFinder(
						"warning"
					)} | Oops, mongodb threw an exception: \`${e}\`.`
				);
			});

		this.client.emit("warnEvent", user, message.author, caseId, reason);

		return message.util.send(
			`>>> 🧾 | Successfully warned **${
				member.user.tag
			}** for **${reason}**. Case id: \`${caseId}\`. ${
				DMed ? "" : "\nℹ | **I couldn't DM this user**"
			}`,
			{ split: true }
		);
	}
}
