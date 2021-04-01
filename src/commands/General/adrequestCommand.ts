import { Message, MessageEmbed } from "discord.js";
import { Command } from "discord-akairo";

export default class adrequestCommand extends Command {
	constructor() {
		super("adrequest", {
			aliases: ["adrequest"],
			channel: "guild",
			userPermissions: ["USE_EXTERNAL_EMOJIS"],
			description: {
				content: "Ad request",
				usage: "adrequest <ad>",
			},
			cooldown: 36e5 * 2,
			args: [
				{
					id: "msg",
					type: "string",
					match: "rest",
					prompt: {
						start: "Please provide a message",
						retry: "Please provide a message",
					},
				},
			],
		});
	}

	async exec(message: Message, { msg }: { msg: string }) {
		if (!msg) return message.util.send("Uhm, why didn't you provide a message?");
		const channel = await this.client.utils.getChannel("710223624442871970");
		const m = await channel.send(
			new MessageEmbed()
				.setColor(this.client.hex)
				.setDescription(msg)
				.setTitle(`New ad request`.substr(0, 32))
				.addField("User", `**${message.author.tag}** (${message.author.toString()})`)
				.setFooter(`React to deny/approve`)
		);

		[
			this.client.utils.emojiFinder("greentick"),
			this.client.utils.emojiFinder("redtick"),
		].forEach((e) => m.react(e));

		await message.delete();
	}
}
