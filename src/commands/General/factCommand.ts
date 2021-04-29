import { Message } from "discord.js";
import { Command } from "discord-akairo";
import fetch from "node-fetch";

export default class factCommand extends Command {
	constructor() {
		super("fact", {
			aliases: ["fact"],
			cooldown: 2e3,
			description: {
				content: "Random fact.",
				usage: "fact",
			},
		});
	}

	async exec(message: Message) {
		const res: Res = await (await fetch("https://uselessfacts.jsph.pl/random.json?language=en"))
			.json()
			.catch((e) => null);
		if (!res) return message.util.send("Unable to find a fact, please try again later.");

		await message.util.send(`From **${res.source}**: \`${res.text}\``);
	}
}

interface Res {
	id: string;
	text: string;
	source: string;
	source_url: string;
	language: string;
	permalink: string;
}
