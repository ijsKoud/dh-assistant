import { Command } from "discord-akairo";
import { Message } from "discord.js";
import Feedback from "../../models/feedback";

export default class feedback extends Command {
	constructor() {
		super("feedback", {
			aliases: ["feedback"],
			userPermissions: ["MANAGE_GUILD"],
			category: "Admin",
			description: {
				content: "Secret Command Only Available for Admins",
				usage: "feedback <msg id>",
			},
			channel: "guild",
			args: [
				{
					id: "msgId",
					type: "string",
				},
			],
		});
	}

	async exec(message: Message, { msgId }: { msgId: string }) {
		await Feedback.findOneAndUpdate(
			{ guildId: message.guild.id },
			{ message: typeof msgId === "string" ? msgId : "", guildId: message.guild.id },
			{ upsert: true }
		).catch((e) => this.client.log(`⚠ | Feedback Command Error: \`${e}\``));
		message.react(this.client.utils.emojiFinder("greentick"));
	}
}
