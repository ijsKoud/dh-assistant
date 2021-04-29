import { Message, MessageEmbed } from "discord.js";
import { Command } from "discord-akairo";

export default class adrequestCommand extends Command {
	constructor() {
		super("adrequest", {
			aliases: ["adrequest"],
			channel: "guild",
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
		if (!msg) {
			const data = this.client.commandHandler.cooldowns.get(message.author.id)?.["adrequest"];
			if (data) {
				data.end = 0;
				clearTimeout(data.timer);
			}
			return message.util.send("Uhm, why didn't you provide a message?");
		}

		if (
			!message.member.hasPermission("USE_EXTERNAL_EMOJIS", { checkAdmin: true, checkOwner: true })
		)
			return message.util.send(
				"Uhm, sorry you only users with level 5+, boosters, members, content creators and staff members are able to do this."
			);

		const channel = await this.client.utils.getChannel("710223624442871970");
		//const channel = await this.client.utils.getChannel("781841366795288576");
		const m = await channel.send(
			new MessageEmbed()
				.setColor(this.client.hex)
				.setDescription(msg)
				.setTitle(`New ad request`.substr(0, 32))
				.addField("User", `**${message.author.tag}** (${message.author.toString()})`)
				.setFooter(`React to deny/approve`)
		);

		[this.client.emoji.greentick, this.client.emoji.redcross].forEach((e) => m.react(e));

		return message.delete();
	}
}
