import { Command } from "discord-akairo";
import { Message, MessageEmbed } from "discord.js";
import { pingChannel } from "../../client/config";

export default class requestping extends Command {
	constructor() {
		super("requestping", {
			aliases: ["requestping"],
			category: "Admin",
			description: {
				content: "Request a ping for events",
				usage: "requestping",
			},
			channel: "guild",
		});
	}

	async exec(message: Message) {
		if (message.channel.id !== pingChannel) return;
		const channel = await this.client.utils.getChannel(pingChannel);
		channel
			.send(
				new MessageEmbed()
					.setTitle(`🔔 Ping request`)
					.setDescription(`Requested by ${message.author.toString()}`)
					.setColor("#9298F4")
			)
			.then((m) =>
				[
					this.client.utils.emojiFinder("greentick"),
					this.client.utils.emojiFinder("redtick"),
				].forEach((e) => m.react(e))
			);
	}
}
