import { Message, TextChannel } from "discord.js";
import { Command } from "discord-akairo";

export default class purgeCommand extends Command {
	constructor() {
		super("purge", {
			aliases: ["purge", "clear"],
			clientPermissions: ["MANAGE_MESSAGES", "USE_EXTERNAL_EMOJIS"],
			userPermissions: ["MANAGE_MESSAGES"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Purges the specified amount of messages from the chat.",
				usage: "purge <message>",
			},
			args: [
				{
					id: "messages",
					type: (_: Message, str: string) =>
						str ? (isNaN(Number(str)) ? null : Number(str)) : null,
				},
			],
		});
	}

	async exec(message: Message, { messages }: { messages: number }) {
		if (!messages || messages >= 100 || messages <= 0)
			return message.util.send(
				this.client.responses.missingArg(`Invalid amount of messages provided.`)
			);

		await message.delete().catch((e) => null);
		let valid = await (message.channel as TextChannel).messages.fetch({ limit: messages });

		const res = await (message.channel as TextChannel).bulkDelete(valid, true);
		if (!res?.size)
			return message.util.send(
				`>>> ${this.client.emoji.redcross} | It looks like I didn't purge any messages, I can only purge messages less than 2 weeks old!`
			);

		(
			await message.util.send(`>>> 🗑 | Sucessfully deleted **${res.size} message(s)**!`, {
				allowedMentions: { users: [] },
			})
		).delete({ timeout: 5e3 });
	}
}
