import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Collection, Message } from "discord.js";

@ApplyOptions<ListenerOptions>({ event: "messageDeleteBulk" })
export default class MessageDeleteBulkListener extends Listener {
	public run(messages: Collection<string, Message>) {
		const { client } = this.container;
		const { size } = messages;
		messages = messages
			.filter((m) => !m.partial && m.content.length > 0 && !m.author.bot && !m.system && !m.webhookId && m.guildId === client.constants.guild)
			.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
		if (messages.size <= 0) return;

		const message = messages.first() as Message;
		const content = messages
			.map((m) => `[${m.author.toString()}]: ${m.content.replace("{\\N}", "")}{\\N}`)
			.join("")
			.match(/.{0,2048}/g)
			?.filter((str) => str.length > 0);
		if (!content) return;

		let i = 0;
		for (const c of content) {
			const embed = client.utils.embed();

			if (i === 0 && content.length === 1)
				embed
					.setTimestamp()
					.setColor("#DC5E55")
					.setFooter(`${messages.size} of ${size} messages shown`)
					.setTitle(`Messages deleted in #${"name" in message.channel ? message.channel.name : ""}`)
					.setDescription(c.replace(/{\\N}/g, "\n"));
			else if (i === 0)
				embed
					.setColor("#DC5E55")
					.setTitle(`Messages deleted in #${"name" in message.channel ? message.channel.name : ""}`)
					.setDescription(c.replace(/{\\N}/g, "\n"));
			else if (i + 1 === content.length)
				embed
					.setTimestamp()
					.setColor("#DC5E55")
					.setFooter(`${messages.size} of ${size} messages shown`)
					.setDescription(c.replace(/{\\N}/g, "\n"));
			else embed.setColor("#DC5E55").setDescription(c.replace(/{\\N}/g, "\n"));

			i += 1;
			client.loggingHandler.sendLogs(embed, "message");
		}
	}
}
