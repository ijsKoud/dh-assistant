import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import type { GuildMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "gclear",
	aliases: ["giveawayclear"],
	description: "Clear the giveaway data",
	preconditions: ["GuildOnly", "SeniorOnly"]
})
export default class GclearCommand extends Command {
	public async messageRun(message: GuildMessage) {
		let i = 0;
		this.client.giveawaysManager.giveaways.forEach(async (giveaway) => {
			if (giveaway.ended && giveaway.messageId) {
				await this.client.giveawaysManager.deleteGiveaway(giveaway.messageId).catch(() => void 0);
				i++;
			}
		});

		return message.reply(`>>> ${this.client.constants.emojis.greentick} | I deleted **${i}** giveaways which wher for eligible deletion.`);
	}
}
