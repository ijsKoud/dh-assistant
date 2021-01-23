import { Listener } from "discord-akairo";

export default class ready extends Listener {
	constructor() {
		super("unhandledRejection", {
			emitter: "process",
			event: "unhandledRejection",
			category: "process",
		});
	}

	async exec(reason: Error, promise: any): Promise<void> {
		this.client.log(
			`⚠ | Oops, an unhandled rejection! At: \`${promise}\`, error: \`${
				reason.stack || reason.message
			}\``
		);
	}
}
