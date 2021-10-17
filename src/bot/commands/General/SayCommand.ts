import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Message, TextChannel } from "discord.js";
import { Args } from "@sapphire/framework";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "say",
	aliases: ["echo"],
	description: "Sends a message to the provided channel",
	requiredUserPermissions: ["MANAGE_CHANNELS"],
	requiredClientPermissions: ["USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
	preconditions: ["GuildOnly"],
	usage: "[channel] <text>",
})
export default class SayCommand extends Command {
	public async messageRun(message: Message, args: Args) {
		let { value: channel } = await args.pickResult("guildTextChannel");
		const { value: msg } = await args.restResult("string");

		if (!channel) channel = message.channel as TextChannel;
		if (!msg) return message.reply(`>>> ${emojis.redcross} | No message provided.`);

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (!channel.permissionsFor(message.member!).has(["SEND_MESSAGES", "VIEW_CHANNEL"]))
			return message.reply(
				`>>> ${emojis.redcross} | You aren't allowed to talk here, you can only echo to channels you can talk in!`
			);

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (!channel.permissionsFor(message.guild!.me!).has(["SEND_MESSAGES", "VIEW_CHANNEL"]))
			return message.reply(`>>> ${emojis.redcross} | I am not allowed to talk in this channel.`);

		await channel.send({
			content: msg.slice(0, 2000),
			files: this.client.utils.getAttachments(message.attachments),
			allowedMentions: { users: [] },
		});

		await message.react(emojis.greentick).catch(() => void 0);
	}
}
