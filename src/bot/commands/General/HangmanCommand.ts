import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Message } from "discord.js";
import { hangMan } from "../../../client/structures/games";

@ApplyOptions<Command.Options>({
	name: "hangman",
	description: "Starts a game of hangman",
	requiredClientPermissions: ["EMBED_LINKS"],
})
export default class HangmanCommand extends Command {
	public async messageRun(message: Message) {
		new hangMan(message).start();
	}
}
