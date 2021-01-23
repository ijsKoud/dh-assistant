import { Listener } from "discord-akairo";
import { TextChannel } from "discord.js";

export default class ready extends Listener {
	constructor() {
		super("ready", {
			emitter: "client",
			event: "ready",
			category: "client",
		});
	}

	async exec(): Promise<void> {
		// client stuff
		this.client.log(`✅ | **${this.client.user.tag}** has logged in!`);
		this.client.user.setActivity("Oslo is ready for testing!", { type: "PLAYING" });
	}

	async getChannel(id: string): Promise<TextChannel> {
		return (this.client.channels.cache.get(id) ||
			(await this.client.channels.fetch(id))) as TextChannel;
	}
}
