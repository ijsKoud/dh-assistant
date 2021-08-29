import { Command } from "../../../client/structures/Command";
import { ApplyOptions } from "@sapphire/decorators";
import { Args } from "@sapphire/framework";
import { Message, User } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "botblacklist",
	aliases: ["botblacklist"],
	description: "Botblacklists a user/guild",
	usage: "<user>",
	preconditions: ["OwnerOnly"],
})
export default class BotWhitelistCommand extends Command {
	public async run(message: Message, args: Args) {
		const { client } = this.container;
		const { value: id } = await args.pickResult("string");
		if (!id)
			return message.reply(`>>> ${client.constants.emojis.redcross} | No user/guild id provided.`);
		if (!client.blacklistManager.blacklisted.includes(id))
			return message.reply(
				`>>> ${client.constants.emojis.redcross} | User/guild is already whitelisted.`
			);

		const data = (await client.utils.fetchUser(id)) || (await client.guilds.fetch(id));
		if (!data)
			return message.reply(`>>> ${client.constants.emojis.redcross} | No user/guild found.`);

		await client.blacklistManager.whitelist(data.id);
		await message.reply(
			`>>> ${client.constants.emojis.redcross} | Successfully whitelisted **${
				data instanceof User ? `${data.tag} (user)` : `${data.name} (guild)`
			}**!`
		);
	}
}
