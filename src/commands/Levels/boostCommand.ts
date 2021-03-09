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
				usage: "rank [user]",
			},
			args: [
				{
					id: "boost",
					type: "number",
					default: 1,
				},
			],
		});
	}

	async exec(message: Message, { boost }: { boost: number }) {
		this.client.levelManager.boost = boost === 0 ? 1 : boost;
		message.react("✅");
	}
}
