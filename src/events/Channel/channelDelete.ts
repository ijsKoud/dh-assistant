import { Listener } from "discord-akairo";
import { GuildChannel, DMChannel } from "discord.js";
import Ticket from "../../model/tickets/Ticket";

export default class channelDelete extends Listener {
	constructor() {
		super("channelDelete", {
			emitter: "client",
			event: "channelDelete",
			category: "client",
		});
	}

	async exec(channel: DMChannel | GuildChannel) {
		if (channel.type !== "text") return;
		if (channel.name !== "ticket") return;

		await Ticket.findOneAndDelete({ channelId: channel.id });
	}
}
