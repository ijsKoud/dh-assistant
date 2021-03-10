import { Command } from "discord-akairo";
import { Message, MessageEmbed } from "discord.js";

export default class leaderboardCommand extends Command {
	public constructor() {
		super("leaderboard", {
			aliases: ["leaderboard", "levels", "ranklist"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Who is number one??",
				usage: "leaderboard",
			},
		});
	}

	async exec(message: Message) {
		const data = (await this.client.levelManager.getLevels(message.guild.id))?.slice(0, 10);
		if (!data) return message.util.send("Uhm, no one earned xp yet. How?");
		message.util.send(
			new MessageEmbed()
				.setColor(this.client.hex)
				.setFooter("Only the first 10 users are shown")
				.setTitle(`Level Leaderboard`)
				.setDescription(
					data.map(
						(d) =>
							`\`${(d.i + 1).toString().padStart(2, "0")}\` - <@${d.level.userId}> (${
								d.level.level
							} / ${this.client.levelManager.getTotal(d.level.level, d.level.xp)})`
					)
				)
		);
	}
}
