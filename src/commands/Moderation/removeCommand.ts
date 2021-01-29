import { Message, TextChannel } from "discord.js";
import { Command } from "discord-akairo";

export default class remove extends Command {
	constructor() {
		super("remove", {
			aliases: ["remove", "delete"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_MESSAGES"],
			description: {
				content: "A command version of the delete message function",
				usage: "remove <channel> <msg id> [reason]",
			},
			cooldown: 1e3,
			args: [
				{
					id: "channel",
					type: "channel",
				},
				{
					id: "messageId",
					type: "string",
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
		{ channel, messageId, reason }: { channel: TextChannel; messageId: string; reason: string }
	) {
		if (!channel) return message.util.send(`>>> ❓ | I was unable to find the specified channel!`);

		const msg: Message = await channel.messages.fetch(messageId).catch((e) => null);

		if (!msg)
			return message.util.send(`> 🔎 | I didn't find a message with the id "${messageId}".`);

		let DMed: boolean = false;
		DMed = true;
		await msg.author
			.send(`>>> 🧾 | **Message Deleted - Draavo's Hangout**\n📃 | Reason: **${reason}**`, {
				split: true,
			})
			.catch((e) => (DMed = false));

		msg.delete().catch((e) => {
			return message.util.send(`Error: ${e}`);
		});

		return message.util.send(
			`>>> 🧾 | Successfully removed the message of **${msg.author.tag}** for **${reason}**. ${
				DMed ? "" : "\nℹ | **I couldn't DM this user**"
			}`,
			{ split: true }
		);
	}
}
