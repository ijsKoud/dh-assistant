import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<ListenerOptions>({ once: true, event: "ready" })
export default class ReadyListener extends Listener {
	public run(): void {
		this.container.client.loggers
			.get("bot")
			?.info(`${this.container.client.user?.tag} has logged in!`);
	}
}
