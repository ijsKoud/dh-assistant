import { Message, Collection, TextChannel } from "discord.js";
import { Command } from "discord-akairo";

export default class purge extends Command {
	constructor() {
		super("purge", {
			aliases: ["purge", "clear"],
			category: "Moderation",
			channel: "guild",
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_MESSAGES"],
			description: {
				content: "Purge messages/clear channels with this command.",
				usage: "purge <amount max 100>",
			},
			cooldown: 3e3,
			args: [
				{
					id: "amount",
					type: "number",
					default: () => 0,
				},
			],
		});
	}

	async exec(message: Message, { amount }: { amount: number }) {
		if (isNaN(amount) || amount < 1 || amount > 100)
			return message.util.send(`Invalid amount, please choose between \`2-100\` messages.`);

		await message.delete();
		const messages = await message.channel.messages.fetch({ limit: amount });
		if (!messages.size)
			return message.util.send(
				`I wasn't able to find any valid messages, I can only purge messages that are less than 2 weeks old.`
			);

		const msgs = await (message.channel as TextChannel).bulkDelete(messages, true);
		const authors: Collection<string, number> = new Collection();

		messages
			.filter((m) => m.createdTimestamp > 12096e5)
			.forEach((m) => authors.set(m.author.tag, authors.get(m.author.tag) + 1 || 1));
		return message.channel
			.send(
				`Successfully purged **${msgs.size}** messages!\n${authors
					.map((v, k) => `${k} - **${v}**`)
					.join("\n")}`,
				{ split: true }
			)
			.then((m) => m.forEach((msg) => msg.delete({ timeout: 5e3 })));
	}
}
