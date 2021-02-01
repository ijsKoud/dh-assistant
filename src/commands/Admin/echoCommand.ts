import { Command } from "discord-akairo";
import { Message } from "discord.js";
import Feedback from "../../models/feedback";

export default class echo extends Command {
	constructor() {
		super("echo", {
			aliases: ["echo"],
			userPermissions: ["MANAGE_GUILD"],
			category: "Admin",
			description: {
				content: "Secret Command Only Available for Admins",
				usage: "echo <channel> <message>",
			},
			channel: "guild",
			args: [
				{
					id: "channelId",
					type: "string",
				},
				{
					id: "msg",
					type: "string",
					match: "rest",
				},
			],
		});
	}

	async exec(message: Message, { channelId, msg }: { channelId: string; msg: string }) {
		const channel = await this.client.utils.getChannel(channelId || "");
		if (!channel || !msg) return message.react(this.client.utils.emojiFinder("redtick"));

		const m = channel.send ? await channel.send(msg).catch((e) => null) : null;
		if (m) return message.react(this.client.utils.emojiFinder("greentick"));
		return message.react(this.client.utils.emojiFinder("redtick"));
	}
}
