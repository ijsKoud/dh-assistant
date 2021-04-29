import { Message } from "discord.js";
import { Command } from "discord-akairo";
import hangMan from "../../classes/games/hangMan";

export default class hangman extends Command {
	constructor() {
		super("hangman", {
			aliases: ["hangman", "hm"],
			description: {
				content: "Starts a hangman game.",
				usage: "hangman",
			},
			channel: "guild",
		});
	}

	async exec(message: Message) {
		new hangMan(message).start();
	}
}
