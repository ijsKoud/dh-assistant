import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class message extends Command {
	constructor() {
		super("message", {
			aliases: ["message", "send"],
			userPermissions: ["MANAGE_ROLES"],
			description: {
				content: 'Send a message to the specified user, use the "-a=true" to make it anonymous.',
				usage: "send <user> <message>",
			},
			channel: "guild",
			args: [
				{
					id: "userId",
					type: "string",
					match: "phrase",
					default: (m: Message) => m.author.id,
				},
				{
					id: "msg",
					type: "string",
					match: "rest",
					default: () => null,
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
		{ userId, msg, anonymous }: { userId: string; msg: string; anonymous: string }
	) {
		const user = await this.client.utils.fetchUser(userId);
		if (!user || !message) return this.client.emit("missingArg", message, ["<user>", "<message>"]);

		let DMed: boolean = true;
		try {
			await user.send(
				`>>> 📢 | You received a message from **${
					anonymous.toLowerCase() === "true" ? "Senior Team" : message.author.tag
				}**:\`\`\`\n${msg}\n\`\`\``
			);
		} catch (e) {
			DMed = false;
		}

		message.util.send(
			`>>> ${this.client.emoji[DMed ? "greentick" : "redcross"]} | ${
				DMed
					? `Successfully DMed **${user.tag}**!`
					: "I was unable to DM this user, most likely because they closed their DMs!"
			}`
		);
	}
}
