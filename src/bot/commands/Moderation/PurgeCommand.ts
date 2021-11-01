import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "purge",
	aliases: ["clear"],
	description: "Purges a channnel",
	usage: "<amount>",
	requiredClientPermissions: ["MANAGE_MESSAGES"],
	preconditions: ["GuildOnly", "TrialModeratorOnly"]
})
export default class PurgeCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: amount } = await args.pickResult("number");
		if (!amount || isNaN(amount)) return message.reply(`>>> ${this.client.constants.emojis.redcross} | Invalid amount provided.`);
		if (amount > 100 || amount <= 0)
			return message.reply(`>>> ${this.client.constants.emojis.redcross} | I cannot purge a negative amount and not more than 100.`);

		await message.delete().catch(() => void 0);
		const messages = await message.channel.bulkDelete(amount, true);
		const m = await message.channel.send(`>>> ${this.client.constants.emojis.greentick} | Successfully purged **${messages.size}** messages!`);
		setTimeout(() => m.delete().catch(() => void 0), 5e3);
	}
}
