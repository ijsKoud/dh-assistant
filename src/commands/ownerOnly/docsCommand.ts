import { Command } from "discord-akairo";
import { Message } from "discord.js";
import fetch from "node-fetch";

export default class docs extends Command {
	constructor() {
		super("docs", {
			aliases: ["docs"],
			clientPermissions: ["EMBED_LINKS"],
			args: [
				{
					id: "query",
					type: "string",
					match: "rest",
				},
			],
			ownerOnly: true,
		});
	}

	async exec(message: Message, { query }: { query: string }) {
		const url = `https://djsdocs.sorta.moe/v2/embed?src=stable&q=${encodeURIComponent(
			query || ""
		)}`;
		if (!query) this.client.emit("missingArg", message, ["query"]);

		try {
			const data = await fetch(url);
			const embed = await data.json();

			if (!embed || embed.error)
				return message.util.send(
					`> ${this.client.utils.emojiFinder(
						"djslogo"
					)} | Sorry, "${query}" couldn't be located within the Discord.js documentation. (https://discord.js.org/)`
				);

			return message.util.send({ embed });
		} catch (e) {
			return message.util.send(e, { split: true, code: true });
		}
	}
}
