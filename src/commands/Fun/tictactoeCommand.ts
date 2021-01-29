import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Tictactoe from "../../games/tictactoe";

export default class tictactoe extends Command {
	constructor() {
		super("tictactoe", {
			aliases: ["tictactoe", "ttt"],
			category: "Fun",
			description: {
				content: "Starts a tictactoe game with someone else.",
				usage: "tictactoe <user>",
			},
			args: [
				{
					id: "userId",
					type: "string",
					match: "phrase",
				},
			],
			channel: "guild",
		});
	}

	async exec(message: Message, { userId }: { userId: string }) {
		const user = await this.client.utils.fetchUser(userId || "");
		if (!user || user.id === message.author.id)
			return message.util.send(`>>> 🔎 | I was unable to find a user called: "${userId}".`);

		if (user.presence.status === "offline")
			return message.channel.send(
				">>> 💤 | Sorry, this user is offline. You can only start a game once the user is online again!"
			);

		if (user.bot || user.system)
			return message.channel.send(">>> 🤖 | Sorry, you cannot start a game with a discord bot.");

		new Tictactoe(message, [message.author.id, user.id]).start();
	}
}
