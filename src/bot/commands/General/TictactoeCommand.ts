import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Message } from "discord.js";

import { Tictactoe } from "../../../client/structures/games";

@ApplyOptions<Command.Options>({
	name: "tictactoe",
	aliases: ["ttt"],
	description: "Starts a game of tictactoe",
	usage: "[user]",
	requiredClientPermissions: ["EMBED_LINKS"],
})
export default class TictactoeCommand extends Command {
	public async messageRun(message: Message, args: Command.Args) {
		const { value: member } = await args.pickResult("member");
		if (!member || member.id === message.author.id)
			return message.reply(">>> 🔎 | I was unable to find the user.");

		if (member.presence?.status === "offline")
			return message.reply(
				">>> 💤 | Sorry, this user is offline. You can only start a game once the user is online again!"
			);

		if (member.user.bot || member.user.system)
			return message.reply(">>> 🤖 | Sorry, you cannot start a game with a discord bot.");

		new Tictactoe(message, [message.author.id, member.id]).start();
	}
}
