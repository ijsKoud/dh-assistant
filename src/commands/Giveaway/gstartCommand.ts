import { MessageEmbed, Message } from "discord.js";
import { Command } from "discord-akairo";
import ms from "ms";

export default class gstartCommand extends Command {
	constructor() {
		super("gstart", {
			aliases: ["gstart", "gcreate"],
			clientPermissions: ["EMBED_LINKS", "ADD_REACTIONS", "MENTION_EVERYONE"],
			userPermissions: ["MANAGE_GUILD"],
			description: {
				content: "Starts a giveaway",
				usage: "gstart <...prompt>",
			},
			cooldown: 2e3,
		});
	}

	async exec(message: Message) {
		const filter = (m: Message) => m.author.id === message.author.id;

		let base = ">>> 🎉 | **Giveaway Setup**:";
		let msg: Message = await message.channel.send(
			base + "Please specify a giveaway channel (mention/id)"
		);
		let collector = (await this.client.utils.awaitMessages(msg, filter))?.first();

		// channel
		if (!collector) return msg.edit(base + "Prompt closed - no response");
		const channel = await this.client.utils.getChannel(this.getArg(collector?.content));
		if (!channel || channel.type !== "text")
			return msg.edit(base + "Prompt closed - invalid channel provided.");

		// date
		msg = await message.channel.send(
			base + "How long is this giveaway going to take (ex: 1d 2h 3m 4s)"
		);
		collector = (await this.client.utils.awaitMessages(msg, filter))?.first();
		if (!collector) return msg.edit(base + "Prompt closed - no response");
		const date = ms(collector?.content || "");
		if (!date) return msg.edit(base + "Prompt closed - invalid duration provided.");

		// winners
		msg = await message.channel.send(base + "How many winners are there? (minimum is 1 winner)");
		collector = (await this.client.utils.awaitMessages(msg, filter))?.first();
		if (!collector) return msg.edit(base + "Prompt closed - no response");
		const winners =
			parseInt(this.getArg(collector?.content)) < 1 ? 1 : parseInt(this.getArg(collector?.content));
		if (!winners) return msg.edit(base + "Prompt closed - invalid amount of winners provided.");

		// required role
		msg = await message.channel.send(
			base + "How long is this giveaway going to take (ex: 1d 2h 3m 4s)"
		);
		collector = (await this.client.utils.awaitMessages(msg, filter))?.first();
		if (!collector) return msg.edit(base + "Prompt closed - no response");
		const requiredRole = ms(collector?.content || "");
		if (!requiredRole) return msg.edit(base + "Prompt closed - invalid duration provided.");
	}

	getArg(str: string): string {
		return str?.split(" ")?.shift();
	}
}
