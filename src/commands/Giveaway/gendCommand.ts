import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Giveaway from "../../models/giveaway/Giveaway";

export default class gendCommand extends Command {
	constructor() {
		super("gend", {
			aliases: ["gend", "gstop"],
			channel: "guild",
			userPermissions: ["MANAGE_ROLES"],
			description: {
				content: "Ends a giveaway",
				usage: "gend <messageId>",
			},
			cooldown: 2e3,
			args: [
				{
					id: "messageId",
					type: "string",
				},
			],
		});
	}

	async exec(message: Message, { messageId }: { messageId: string }) {
		if (!messageId) return message.util.send("Unkown message id provided.");

		const data = await Giveaway.findOne({ messageId, guildId: message.guild.id });
		if (!data) return message.util.send("Unable to find the correct giveaway.");
		data.date = Date.now();

		clearTimeout(this.client.giveaways.cache.get(data.messageId));
		await this.client.giveaways.setGiveaway(data);
		await message.react("✅");
	}
}
