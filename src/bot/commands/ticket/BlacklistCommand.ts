import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import type { GuildMessage } from "../../../client/structures/Moderation";

@ApplyOptions<Command.Options>({
	name: "blacklist",
	aliases: ["whitelist"],
	description: "blacklist/whitelist a user",
	usage: "<user>",
	preconditions: ["ManagerOnly", "GuildOnly"]
})
export default class BlacklistCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: user } = await args.pickResult("user");
		if (!user) return message.reply(`>>> ${this.client.constants.emojis.redcross} | Was not able to find the user on Discord at all.`);

		const blacklist = await this.client.prisma.ticketBlacklist.findFirst({
			where: { id: user.id }
		});
		if (blacklist) {
			await this.client.prisma.ticketBlacklist.delete({ where: { id: user.id } });
			return message.reply(
				`>>> ${this.client.constants.emojis.greentick} | Successfully removed the blacklist of **${user.tag}** (${user.toString()})`
			);
		}

		await this.client.prisma.ticketBlacklist.create({ data: { id: user.id } });
		return message.reply(
			`>>> ${this.client.constants.emojis.greentick} | Successfully added **${user.tag}** (${user.toString()}) to the blacklist`
		);
	}
}
