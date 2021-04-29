import { Command } from "discord-akairo";
import { Message } from "discord.js";
import botBlacklist from "../../models/bot/botBlacklist";

export default class bblacklistCommand extends Command {
	constructor() {
		super("bblacklist", {
			aliases: ["bblacklist"],
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
			if (blacklist) return message.util.send("Guild is already blacklisted.");

			await botBlacklist.create({ guildId: guild.id });
			return message.util.send(`Successfully blacklisted **${guild.name}** (${guild.id})`);
		}

		const blacklist = await botBlacklist.findOne({ userId: user.id });
		if (blacklist) return message.util.send("User is already blacklisted.");

		await botBlacklist.create({ userId: user.id });
		message.util.send(`Successfully blacklisted **${user.tag}** (${user.toString()})`);
	}
}
