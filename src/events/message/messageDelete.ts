import { Message, MessageEmbed } from "discord.js";
import { Listener } from "discord-akairo";
import { WebhookClient } from "discord.js";

const types = {
	spam: "spam",
	blacklisted: "use blacklisted words",
	mention: "mass mention users",
};

const webhook = new WebhookClient(process.env.MESSAGE_ID, process.env.MESSAGE_TOKEN);
export default class messageDeleteEvent extends Listener {
	constructor() {
		super("messageDelete", {
			emitter: "client",
			event: "messageDelete",
		});
	}

	async exec(message: Message) {
		if (message.channel.type === "dm") return;
		if (message.guild.id !== process.env.GUILD) return;
		await message.channel.fetch(true);

		if (
			message.partial ||
			message.author.bot ||
			message.system ||
			message.webhookID ||
			this.client.config.whitelistedChannels.includes(message.channel.id)
		)
			return;

		webhook.send(
			new MessageEmbed()
				.setTimestamp()
				.setColor("#DC5E55")
				.setFooter("Deleted at")
				.setAuthor(
					message.author.tag,
					message.author.displayAvatarURL({ dynamic: true, size: 4096 })
				)
				.setTitle(`Message deleted in #${message.channel.name}`)
				.setURL(message.url)
				.setDescription(
					"**content**: " +
						(message.content.length > 2000
							? message.content.substr(0, 2000) + "..."
							: message.content)
				)
		);
	}
}
