import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Args } from "@sapphire/framework";
import { GuildMessage } from "../../../client/structures/Moderation";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "purge",
	aliases: ["clear"],
	description: "Purges a channnel",
	usage: "<amount>",
	requiredClientPermissions: ["MANAGE_MESSAGES"],
	preconditions: ["GuildOnly", "TrialModeratorOnly"],
})
export default class PurgeCommand extends Command {
	public async run(message: GuildMessage, args: Args) {
		if (message.channel.type === "DM") return;
		const { value: amount } = await args.pickResult("number");
		if (!amount || isNaN(amount))
			return message.reply(`>>> ${emojis.redcross} | Invalid amount provided.`);
		if (amount > 100 || amount <= 0)
			return message.reply(
				`>>> ${emojis.redcross} | I cannot purge a negative amount and not more than 100.`
			);

		await message.delete().catch(() => void 0);
		const messages = await message.channel.bulkDelete(amount, true);
		const m = await message.channel.send(
			`>>> ${emojis.greentick} | Successfully purged **${messages.size}** messages!`
		);
		setTimeout(() => m.delete().catch(() => void 0), 5e3);
	}
}