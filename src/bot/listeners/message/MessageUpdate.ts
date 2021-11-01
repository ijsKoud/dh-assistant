import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import type { Message } from "discord.js";

@ApplyOptions<ListenerOptions>({ event: "messageUpdate" })
export default class MessageUpdateListener extends Listener {
	public async run(oldMessage: Message, newMessage: Message) {
		const { client } = this.container;
		if (newMessage.partial) await newMessage.fetch();
		if (oldMessage.partial) {
			oldMessage = newMessage;
			oldMessage.content = "unkown";
		}
		if (newMessage.author.partial) {
			await newMessage.author.fetch();
			oldMessage.author = newMessage.author;
		}

		if (
			newMessage.guildId !== client.constants.guild ||
			newMessage.author.bot ||
			newMessage.system ||
			newMessage.webhookId ||
			oldMessage.content === newMessage.content
		)
			return;

		const embed = client.utils
			.embed()
			.setColor("#4a7cc5")
			.setTitle(`Message edited in #${"name" in newMessage.channel ? newMessage.channel.name : ""}`)
			.setDescription(`[Jump to message](${newMessage.url})`)
			.setFooter(`${newMessage.author.tag} - ${newMessage.author.id}`, newMessage.author.displayAvatarURL({ dynamic: true, size: 4096 }))
			.setTimestamp()
			.addFields([
				{
					name: "• Before",
					value: oldMessage.content.substr(0, 1024)
				},
				{
					name: "• After",
					value: newMessage.content.substr(0, 1024)
				}
			]);

		client.loggingHandler.sendLogs(embed, "message");
		await client.automod.run(newMessage);
	}
}
