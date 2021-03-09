import { MessageEmbed, Message } from "discord.js";
import { Command } from "discord-akairo";

export default class avatar extends Command {
	constructor() {
		super("avatar", {
			aliases: ["avatar"],
			clientPermissions: ["EMBED_LINKS"],
			description: {
				content: "Displays the avatar of you or someone else",
				usage: "avatar [user]",
			},
			cooldown: 2e3,
			args: [
				{
					id: "userId",
					type: "string",
					match: "phrase",
				},
			],
		});
	}

	async exec(message: Message, { userId }: { userId: string }) {
		const user = (await this.client.utils.fetchUser(userId)) || message.author;
		message.util.send(
			new MessageEmbed()
				.setColor(this.client.hex)
				.setTitle(`Avatar of ${user.tag}`)
				.setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
		);
	}
}
