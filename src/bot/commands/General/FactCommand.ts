import { Command } from "../../../client/structures/Command";
import { ApplyOptions } from "@sapphire/decorators";
import { Message, Util } from "discord.js";
import axios from "axios";

@ApplyOptions<Command.Options>({
	name: "fact",
	aliases: ["uselessfact"],
	description: "Shows you a useless fact",
})
export default class FactCommand extends Command {
	public async run(message: Message) {
		const { data } = await axios
			.get<Res>("https://uselessfacts.jsph.pl/random.json?language=en")
			.catch(() => ({ data: null }));
		if (!data)
			return message.reply(
				`>>> ${this.container.client.constants.emojis.redcross} | Unable to find a fact, please try again later.`
			);

		await message.reply(`From **${data.source}**: \`${Util.escapeMarkdown(data.text)}\``);
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
