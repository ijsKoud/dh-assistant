import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "xpboost",
	description: "Enable the XP boost",
	usage: "<multiplier> [--user=<user>]",
	preconditions: ["GuildOnly", "ManagerOnly"],
	options: ["user"]
})
export default class XpboostCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: multiplier } = await args.pickResult("integer");

		const userOption = args.getOption("user");
		if (userOption) {
			const user = await this.client.utils.fetchMember(userOption, message.guild);
			if (user) {
				if (multiplier) this.client.multipliers.set(user.id, multiplier || 1);
				else this.client.multipliers.delete(user.id);

				return message.reply(
					`>>> ${this.client.constants.emojis.greentick} | Successfully set the multiplier of **${user.user.tag}** to \`${
						multiplier || "none"
					}\`!`
				);
			}
		}

		this.client.levelManager.boost = multiplier || 1;
		await message.reply(`>>> ${this.client.constants.emojis.greentick} | Successfully set the global multiplier to \`${multiplier || "none"}\`!`);
	}
}
