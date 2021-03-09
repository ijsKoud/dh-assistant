import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class colourCommand extends Command {
	public constructor() {
		super("colour", {
			aliases: ["colour", "color"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "change your rank card colour",
				usage: "rank [user]",
			},
			args: [
				{
					id: "colour",
					type: (_: Message, str: string) => (str.includes("#") ? str : null),
				},
			],
		});
	}

	async exec(message: Message, { colour }: { colour: string }) {
		const data = await this.client.levelManager.getUser(message.author.id, message.guild.id);
		if (!data) return message.util.send("You don't have any xp yet, send some messages first.");

		if (
			data.level < 10 &&
			!message.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true })
		)
			return message.util.send("Sorry, you can only change your colour when you are level 10+");
		if (!colour) return message.util.send("the colour must be an hex object (ex: #ffffff)");
		await this.client.levelManager.updateUser(message.author.id, message.guild.id, {
			colour: colour || this.client.hex,
		});
		if (colour) message.react("✅");
	}
}
