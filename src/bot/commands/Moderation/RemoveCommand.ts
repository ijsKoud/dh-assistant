import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Args } from "@sapphire/framework";
import { GuildMessage } from "../../../client/structures/Moderation";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "remove",
	aliases: ["removemsg", "removemessage", "deletemsg", "deletemessaGE"],
	description: "Deletes a message from a channel and DMs the user",
	usage: "<channel> <message Id> <reason>",
	preconditions: ["GuildOnly", "TrialModeratorOnly"],
})
export default class RemoveCommand extends Command {
	public async run(message: GuildMessage, args: Args) {
		const { value: channel } = await args.pickResult("guildChannel");
		if (
			!channel ||
			channel.type === "GUILD_CATEGORY" ||
			channel.type === "GUILD_VOICE" ||
			channel.type === "GUILD_STAGE_VOICE" ||
			channel.type === "GUILD_STORE"
		)
			return message.reply(`>>> ${emojis.redcross} | Incorrect channel provided.`);

		const { value: msg } = await args.pickResult("message", { channel });
		const { value: reason } = await args.restResult("string");
		if (!msg) return message.reply(`>>> ${emojis.redcross} | No message Id provided.`);
		if (!reason) return message.reply(`>>> ${emojis.redcross} | No reason provided.`);

		await msg.delete();
		await msg.author
			.send(
				`>>> 👮‍♂️ | One of your message in ${channel.toString()} has been deleted by one of our Moderators:\n${
					reason ?? "No reason provided"
				}`
			)
			.catch(() => void 0);
		await message.reply(
			`>>> ${
				emojis.greentick
			} | Successfully deleted message in ${channel.toString()} with the Id **${msg.id}**.`
		);
	}
}
