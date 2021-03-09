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
				this.client.mod.automod = !this.client.mod.automod;
				message.util.send(`Automod is now **${this.client.automod ? "enabled" : "disabled"}**.`);
				break;
			case "alt-detection":
				this.client.mod.altDefender = !this.client.mod.altDefender;
				message.util.send(
					`Alt-detection is now **${this.client.mod.altDefender ? "enabled" : "disabled"}**.`
				);
				break;
			case "view":
				message.util.send(
					`Automod: **${this.client.mod.automod ? "enabled" : "disabled"}**.\nAlt-detection: **${
						this.client.mod.altDefender ? "enabled" : "disabled"
					}**.`
				);
				break;
			default:
				break;
		}
	}
}
