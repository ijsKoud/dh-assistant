import { Message } from "discord.js";
import { Command } from "discord-akairo";
import { nanoid } from "nanoid";

export default class gencodeCommand extends Command {
	constructor() {
		super("gencode", {
			aliases: ["gencode"],
			clientPermissions: ["MANAGE_ROLES"],
			channel: "guild",
			cooldown: 1e3,
			args: [
				{
					id: "id",
					type: "lowercase",
				},
			],
		});
	}

	async exec(message: Message, { id }: { id: string }) {
		const member = await this.client.utils.fetchMember(id, message.guild);
		if (!member) return message.util.send("No member found.");
		if (!member.roles.cache.has("701782730756849744"))
			return message.util.send("User is not a trail moderator.");

		let code = nanoid(8);
		while (this.client.trainingCodes.has(code)) code = nanoid(8);

		this.client.trainingCodes.set(code, member.id);
		await message.util.send(`Code for **${member.user.tag}** (${member.toString()}): \`${code}\``, {
			allowedMentions: { users: [] },
		});
	}
}
