import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class uboostCommand extends Command {
	public constructor() {
		super("uboost", {
			aliases: ["uboost"],
			channel: "guild",
			userPermissions: ["MANAGE_GUILD"],
			cooldown: 1e3,
			description: {
				content: "Update the xp boost of the specified user",
				usage: "uboost <user> [number (default: 1)>",
			},
			args: [
				{
					id: "id",
					type: "string",
				},
				{
					id: "boost",
					type: (_: Message, str: string) =>
						str ? (parseInt(str) > 10 ? null : parseInt(str)) : null,
					default: 1,
				},
			],
		});
	}

	async exec(message: Message, { id, boost }: { id: string; boost: number }) {
		const member = await this.client.utils.fetchMember(id, message.guild);
		if (!member && !id)
			return message.util.send(this.client.responses.missingArg("Invalid user provided."));

		member.multiplier = boost < 1 ? 1 : boost;

		this.client.log(
			"INFO",
			`XP Multiplier of ${member.user.id} / ${member.user.tag} changed to ${member.multiplier} by ${message.author.id} / ${message.author.tag}`
		);

		await message.react("✅");
	}
}
