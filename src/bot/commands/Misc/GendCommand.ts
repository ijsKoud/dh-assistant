import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage } from "../../../client/structures/Moderation";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "gend",
	aliases: ["giveawayend"],
	description: "End a giveaway",
	preconditions: ["GuildOnly", "ManagerOnly"],
})
export default class GendCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: messageId } = await args.pickResult("string");
		if (!messageId) return message.reply(`>>> ${emojis.redcross} | No messageId provided.`);

		await this.client.giveawaysManager.end(messageId).catch(() => void 0);
	}
}
