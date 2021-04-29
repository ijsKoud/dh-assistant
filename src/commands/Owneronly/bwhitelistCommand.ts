import { Command } from "discord-akairo";
import { Message } from "discord.js";
import botBlacklist from "../../models/bot/botBlacklist";

export default class bwhitelistCommand extends Command {
	constructor() {
		super("bwhitelist", {
			aliases: ["bwhitelist"],
			args: [
				{
					id: "id",
					type: "string",
				},
			],
			ownerOnly: true,
		});
	}

	async exec(message: Message, { id }: { id: string }) {
		const user = await this.client.utils.fetchUser(id);
		if (!user) {
			const guild =
				this.client.guilds.cache.get(id) || (await this.client.guilds.fetch(id).catch((e) => null));
			if (!guild) return message.util.send("No user/guild found.");

			const blacklist = await botBlacklist.findOne({ guildId: guild.id });
			if (!blacklist) return message.util.send("Guild is already whitelisted");

			await blacklist.delete();
			return message.util.send(`Successfully whitelisted **${guild.name}** (${guild.id})`);
		}

		const blacklist = await botBlacklist.findOne({ userId: user.id });
		if (!blacklist) return message.util.send("User is already whitelisted");

		await blacklist.deleteOne();
		message.util.send(`Successfully whitelist **${user.tag}** (${user.toString()})`);
	}
}
