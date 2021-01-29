import { Listener } from "discord-akairo";
import { WebhookClient, Message, MessageEmbed } from "discord.js";
import { secretChannels } from "../../client/config";

const webhook = new WebhookClient(process.env.MSGLOGID, process.env.MSGLOGTOKEN);

export default class messageDelete extends Listener {
	constructor() {
		super("messageDelete", {
			emitter: "client",
			category: "client",
			event: "messageDelete",
		});
	}

	async exec(message: Message) {
		if (message.channel.type === "dm") return;
		await message.channel.fetch(true);

		if (
			message.partial ||
			message.author.bot ||
			message.system ||
			message.webhookID ||
			secretChannels.includes(message.channel.id)
		)
			return;

		const embed = new MessageEmbed()
			.setTimestamp()
			.setColor("#DC5E55")
			.setFooter("Deleted at")
			.setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 4096 }))
			.setTitle(`Message deleted in #${message.channel.name}`)
			.setDescription(
				"**content**: " +
					(message.content.length > 2000
						? message.content.substr(0, 2000) + "..."
						: message.content)
			);

		webhook.send(embed);
	}
}
