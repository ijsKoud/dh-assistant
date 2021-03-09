import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class rankCommand extends Command {
	public constructor() {
		super("rank", {
			aliases: ["rank", "rankcard"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Gives you the rankcard of you are someone else",
				usage: "rank [user]",
			},
			args: [
				{
					id: "id",
					type: "string",
					default: (m: Message) => m.author.id,
				},
			],
		});
	}

	async exec(message: Message, { id }: { id: string }) {
		const user = (await this.client.utils.fetchUser(id)) || message.author;
		const data = await this.client.levelManager.getUser(user.id, message.guild.id);
		if (!data) return message.util.send("This user doesn't have any xp yet.");

		const rank = await this.client.levelManager.getCard(user, data);
		message.util.send(rank);
	}
}
