import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Args } from "@sapphire/framework";
import { GuildMessage, ModerationMessage } from "../../../client/structures/Moderation";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "message",
	description: "Sends a message to a user",
	usage: "<user> <message> [--author=<author>]",
	preconditions: ["GuildOnly", "ModeratorOnly"],
	options: ["author"],
})
export default class MessageCommand extends Command {
	public async run(message: GuildMessage, args: Args) {
		const { value: member } = await args.pickResult("member");
		const { value: DmMessage } = await args.restResult("string");
		const author = args.getOption("author") ?? message.author.tag;
		if (!member)
			return message.reply(`>>> ${emojis.redcross} | Couldn't find that user in this server.`);

		const msg = await message.reply(`>>> ${emojis.loading} | Messaging **${member.user.tag}**...`);
		const date = Date.now();

		const log = ModerationMessage.logs(
			`Message sent as **${author}**`,
			"message",
			member.user,
			message.author,
			"Not logged in Database",
			date
		);

		this.client.loggingHandler.sendLogs(log, "mod", this.client.automod.settings.logging.mod);
		await member
			.send(`>>> 📣 | You received a message from **${author}**:\n${DmMessage}`.slice(0, 2e3))
			.catch(() => void 0);

		await msg.edit(
			`>>> ${emojis.greentick} | Successfully DMed **${member.user.tag}** as **${author}**.`
		);
	}
}
