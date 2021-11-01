import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Message, TextChannel } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "say",
	aliases: ["echo"],
	description: "Sends a message to the provided channel",
	requiredUserPermissions: ["MANAGE_CHANNELS"],
	requiredClientPermissions: ["USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
	preconditions: ["GuildOnly"],
	usage: "[channel] <text>"
})
export default class SayCommand extends Command {
	public async messageRun(message: Message, args: Command.Args) {
		let { value: channel } = await args.pickResult("guildTextChannel");
		const { value: msg } = await args.restResult("string");

		if (!channel) channel = message.channel as TextChannel;
		if (!msg) return message.reply(`>>> ${this.client.constants.emojis.redcross} | No message provided.`);

		if (!channel.permissionsFor(message.member!).has(["SEND_MESSAGES", "VIEW_CHANNEL"]))
			return message.reply(
				`>>> ${this.client.constants.emojis.redcross} | You aren't allowed to talk here, you can only echo to channels you can talk in!`
			);

		if (!channel.permissionsFor(message.guild!.me!).has(["SEND_MESSAGES", "VIEW_CHANNEL"]))
			return message.reply(`>>> ${this.client.constants.emojis.redcross} | I am not allowed to talk in this channel.`);

		await channel.send({
			content: msg.slice(0, 2000),
			files: this.client.utils.getAttachments(message.attachments),
			allowedMentions: { users: [] }
		});

		await message.react(this.client.constants.emojis.greentick).catch(() => void 0);
	}
}
