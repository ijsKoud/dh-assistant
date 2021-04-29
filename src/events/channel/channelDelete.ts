import { Listener } from "discord-akairo";
import { GuildChannel } from "discord.js";

export default class channelDeleteListener extends Listener {
	constructor() {
		super("channelDelete", {
			emitter: "client",
			event: "channelDelete",
		});
	}

	async exec(channel: GuildChannel) {
		try {
			if (
				channel.type !== "text" ||
				!channel.name.startsWith("dev-") ||
				!channel.name.startsWith("ticket-")
			)
				return;
			const ticket = await this.client.ticketHandler.getTicket(channel.name);
			if (!ticket) return;

			await this.client.ticketHandler.close(ticket);
		} catch (e) {
			this.client.log("ERROR", `ChannelDelete event error: \`\`\`${e.stack || e.message}\`\`\``);
		}
	}
}
