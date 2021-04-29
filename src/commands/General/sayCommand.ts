import { Command } from "discord-akairo";
import { Message, TextChannel } from "discord.js";

export default class sayCommand extends Command {
	constructor() {
		super("say", {
			aliases: ["say", "echo"],
			channel: "guild",
			userPermissions: ["MANAGE_CHANNELS"],
			clientPermissions: ["USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
			cooldown: 1e3,
			description: {
				content: "Sends a message to the provided channel",
				usage: "say [channel] <message>",
			},
			args: [
				{
					id: "id",
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

	async exec(message: Message, { id, msg }: { id: string; msg: string }) {
		let channel = await this.client.utils.getChannel(id);
		if (channel && !msg)
			return message.util.send(
				`>>> ${this.client.emoji.redcross} | **Syntax Error**:\nNo message provided.`
			);

		if (!channel) {
			channel = message.channel as TextChannel;
			msg = [id, msg].filter((str) => str !== null).join(" ");
		}

		if (!channel.permissionsFor(message.member).has(["SEND_MESSAGES", "VIEW_CHANNEL"]))
			return message.util.send(
				`>>> ${this.client.emoji.redcross} | You aren't allowed to talk here, you can only echo to channels you can talk in!`
			);

		if (!channel.permissionsFor(this.client.user).has(["SEND_MESSAGES", "VIEW_CHANNEL"]))
			return message.util.send(
				`>>> ${this.client.emoji.redcross} | I am not allowed to talk in this channel.`
			);

		await channel.send(`${msg}`, {
			split: true,
			files: this.client.utils.getAttachments(message.attachments),
			allowedMentions: { users: [] },
		});
		await message.react(this.client.emoji.greentick).catch((e) => null);
	}
}
