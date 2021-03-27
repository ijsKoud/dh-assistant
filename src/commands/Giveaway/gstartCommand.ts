import { MessageEmbed, Message } from "discord.js";
import { Command } from "discord-akairo";

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
		// ...do stuff
	}
}
