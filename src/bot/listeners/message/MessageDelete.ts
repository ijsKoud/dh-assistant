import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Message } from "discord.js";

@ApplyOptions<ListenerOptions>({ event: "messageDelete" })
export default class MessageDeleteListener extends Listener {
	public async run(message: Message) {
		const { client } = this.container;
		if (message.partial) return;
		if (message.author.partial) await message.author.fetch();
		if (message.author.bot || message.guildId !== client.constants.guild || message.system || message.webhookId) return;

		const embed = client.utils
			.embed()
			.setColor("#c04e3f")
			.setTitle(`Message deleted in #${"name" in message.channel ? message.channel.name : ""}`)
			.setDescription(message.content)
			.setTimestamp()
			.setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL({ dynamic: true, size: 4096 }));

		client.loggingHandler.sendLogs(embed, "message");
	}
}
