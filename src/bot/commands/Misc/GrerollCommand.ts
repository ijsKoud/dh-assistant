import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage } from "../../../client/structures/Moderation";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "greroll",
	aliases: ["giveawayreroll"],
	description: "Rerolls a giveaway",
	preconditions: ["GuildOnly", "ManagerOnly"],
})
export default class GrerollCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: messageId } = await args.pickResult("string");
		if (!messageId) return message.reply(`>>> ${emojis.redcross} | No messageId provided.`);

		await this.client.giveawaysManager.reroll(messageId).catch(() => void 0);
	}
}
