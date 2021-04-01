import { Message } from "discord.js";
import { Command } from "discord-akairo";
import Giveaway from "../../model/giveaway/Giveaway";

export default class grerollCommand extends Command {
	constructor() {
		super("greroll", {
			aliases: ["greroll"],
			channel: "guild",
			userPermissions: ["MANAGE_ROLES"],
			description: {
				content: "Reroll the giveaway winner(s)",
				usage: "greroll <channel> <messageId>",
			},
			cooldown: 2e3,
			args: [
				{
					id: "id",
					type: "string",
				},
				{
					id: "messageId",
					type: "string",
				},
			],
		});
	}

	async exec(message: Message, { id, messageId }: { id: string; messageId: string }) {
		const channel = await this.client.utils.getChannel(id);
		if (!messageId || !channel) return message.util.send("Unkown message id/channel provided.");

		const data = await Giveaway.findOne({ messageId, guildId: message.guild.id });
		if (data) return message.util.send("Giveaway still active, end it first to reroll.");

		const d = await this.client.giveaway.setGiveaway({
			requiredRole: message.guild.id,
			channelId: channel.id,
			date: Date.now(),
			winners: 1,
			messageId: messageId,
			guildId: message.guild.id,
		});
		if (d) await message.react("✅");
		else
			await message.util.send(
				"Unkown giveaway, make sure you provided the correct channel/message id."
			);
	}
}
