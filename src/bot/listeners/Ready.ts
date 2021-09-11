import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import axios from "axios";

@ApplyOptions<ListenerOptions>({ once: true, event: "ready" })
export default class ReadyListener extends Listener {
	public run(): void {
		this.container.client.loggers
			.get("bot")
			?.info(`${this.container.client.user?.tag} has logged in!`);

		this.setStatus();
	}

	private async setStatus() {
		const { client } = this.container;
		const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCkMrp3dJhWz2FcGTzywQGWg&key=${process.env.YOUTUBE_API_KEY}`;

		const { data } = await axios
			.get(url)
			.catch(() => ({ data: { items: [{ statistics: { subscriberCount: "unkown" } }] } }));
		const subCount = data.items[0].statistics.subscriberCount;

		client.user?.setPresence({
			status: "dnd",
			activities: [
				{
					type: "PLAYING",
					name: `with ${subCount} subscribers!`,
				},
			],
		});

		setInterval(this.setStatus.bind(this), 6e5);
	}
}
