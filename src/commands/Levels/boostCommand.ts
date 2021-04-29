import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class boostCommand extends Command {
	public constructor() {
		super("boost", {
			aliases: ["boost"],
			channel: "guild",
			userPermissions: ["MANAGE_GUILD"],
			cooldown: 1e3,
			description: {
				content: "Update the xp boost to give people more xp per minute",
				usage: "boost <number>",
			},
			args: [
				{
					id: "boost",
					type: (_: Message, str: string) =>
						str ? (parseInt(str) > 10 ? null : parseInt(str)) : null,
					default: 1,
				},
			],
		});
	}

	async exec(message: Message, { boost }: { boost: number }) {
		this.client.levelManager.boost = boost < 1 ? 1 : boost;
		this.client.log(
			"INFO",
			`XP Multiplier changed to ${this.client.levelManager.boost} by ${message.author.id} / ${message.author.tag}`
		);

		await message.react("✅");
	}
}
