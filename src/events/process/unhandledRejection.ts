import { Listener } from "discord-akairo";

export default class unhandledRejection extends Listener {
	constructor() {
		super("unhandledRejection", {
			emitter: "process",
			event: "unhandledRejection",
			category: "process",
		});
	}

	async exec(reason: Error) {
		this.client.log("ERROR", `Unhandled rejection: \`\`\`${reason.stack || reason.message}\`\`\``);
	}
}
