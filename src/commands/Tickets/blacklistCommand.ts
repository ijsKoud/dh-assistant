import { Command } from "discord-akairo";
import { Message } from "discord.js";
import Blacklist from "../../model/tickets/Blacklist";

export default class blacklistCommand extends Command {
	public constructor() {
		super("blacklist", {
			aliases: ["blacklist"],
			channel: "guild",
			description: {
				content: "blacklist a user or remove them from the blacklist",
				usage: "blacklist <user>",
			},
			args: [
				{
					id: "userId",
					type: "string",
					prompt: {
						start: "Who do you want to blacklist?",
						retry: "Who do you want to blacklist?",
					},
				},
			],
		});
	}

	async exec(message: Message, { userId }: { userId: string }) {
		const user = await this.client.utils.fetchUser(userId);
		if (!user) return message.util.send(`>>> 🔎 | I was unable to find a user called "${userId}"!`);

		let type: "removed" | "added";
		const config = await Blacklist.findOne({ userId: user.id });
		if (config) {
			type = "removed";
			await config.deleteOne();
		} else {
			await Blacklist.create({
				userId: user.id,
			});
			type = "added";
		}

		message.util.send(
			`>>> ✅ | Successfully **${type}** this user ${
				type === "removed" ? "from" : "to"
			} the blacklist!`
		);
	}
}
