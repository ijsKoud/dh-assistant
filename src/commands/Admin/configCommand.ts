import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class configCommand extends Command {
	constructor() {
		super("config", {
			aliases: ["config"],
			userPermissions: ["MANAGE_GUILD"],
			category: "Admin",
			channel: "guild",
			args: [
				{
					id: "type",
					type: (_: Message, str: string) =>
						["automod", "alt-detection", "view"].includes(str?.toLowerCase() || "")
							? str.toLowerCase()
							: null,
					default: () => "view",
				},
			],
		});
	}

	async exec(message: Message, { type }: { type: string }) {
		switch (type) {
			case "automod":
				this.client.automod = !this.client.automod;
				message.util.send(`Automod is now **${this.client.automod ? "disabled" : "enabled"}**.`);
				break;
			case "alt-detection":
				this.client.altDetection = !this.client.altDetection;
				message.util.send(
					`Alt-detection is now **${this.client.altDetection ? "disabled" : "enabled"}**.`
				);
				break;
			case "view":
				message.util.send(
					`Automod: **${this.client.automod ? "enabled" : "disabled"}**.\nAlt-detection: **${
						this.client.altDetection ? "disabled" : "enabled"
					}**.`
				);
				break;
			default:
				break;
		}
	}
}
