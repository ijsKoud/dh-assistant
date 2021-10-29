import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Message, MessageActionRow, MessageButton, Util } from "discord.js";
import axios from "axios";

@ApplyOptions<Command.Options>({
	name: "fact",
	aliases: ["uselessfact"],
	description: "Shows you a useless fact",
})
export default class FactCommand extends Command {
	public async messageRun(message: Message) {
		const { data } = await axios
			.get<string>("https://daangamesdg.wtf/api/fact")
			.catch(() => ({ data: null }));
		if (!data)
			return message.reply(
				`>>> ${this.client.constants.emojis.redcross} | Unable to find a fact, please try again later.`
			);

		const actionRow = new MessageActionRow().addComponents(
			new MessageButton()
				.setURL("https://daangamesdg.wtf/api/fact?all=true")
				.setLabel("Source")
				.setStyle("LINK")
		);
		await message.reply({ content: `\`${Util.escapeMarkdown(data)}\``, components: [actionRow] });
	}
}
