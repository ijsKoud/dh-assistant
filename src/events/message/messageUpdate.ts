import { Message, MessageEmbed, WebhookClient } from "discord.js";
import { Listener } from "discord-akairo";
import { secretChannels } from "../../client/config";

const webhook = new WebhookClient(process.env.MSGLOGID, process.env.MSGLOGTOKEN);

export default class messageUpdate extends Listener {
	constructor() {
		super("messageUpdate", {
			event: "messageUpdate",
			emitter: "client",
			category: "client",
		});
	}

	async exec(oldMessage: Message, newMessage: Message) {
		if (oldMessage.partial) oldMessage = await oldMessage.fetch(true);
		if (newMessage.partial) newMessage = await newMessage.fetch(true);

		const message = oldMessage;
		if (message.channel.type === "dm") return;
		await message.channel.fetch(true);

		if (
			message.partial ||
			message.author.bot ||
			message.system ||
			message.webhookID ||
			secretChannels.includes(message.channel.id) ||
			oldMessage.content === newMessage.content
		)
			return;

		const embed = new MessageEmbed()
			.setTimestamp()
			.setColor("#4389F0")
			.setFooter("updated at")
			.setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 4096 }))
			.setTitle(`Message updated in #${message.channel.name}`)
			.setDescription(
				`**Before**: ${
					message.content.length > 800 ? message.content.substr(0, 800) + "..." : message.content
				}` +
					"\n" +
					`**After**: ${
						newMessage.content.length > 800
							? newMessage.content.substr(0, 800) + "..."
							: newMessage.content
					}`
			);

		webhook.send(embed);
	}
}
