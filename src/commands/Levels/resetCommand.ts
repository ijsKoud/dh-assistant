import { Command } from "discord-akairo";
import { User } from "discord.js";
import { MessageReaction } from "discord.js";
import { Message } from "discord.js";
import Level from "../../model/levels/Level";

export default class resetCommand extends Command {
	public constructor() {
		super("reset", {
			aliases: ["reset"],
			channel: "guild",
			userPermissions: ["MANAGE_GUILD"],
			cooldown: 1e3,
			description: {
				content: "reset someones level/xp",
				usage: "level <user>",
			},
			args: [
				{
					id: "id",
					type: "string",
					default: 1,
				},
			],
		});
	}

	async exec(message: Message, { id }: { id: string }) {
		const user = await this.client.utils.fetchUser(id);
		if (!user) return message.util.send(this.client.messages.noUser.replace("{USER}", id));

		const data = await this.client.levelManager.getUser(user.id, message.guild.id);
		if (!data) return message.util.send("No level config found.");

		const member = await this.client.utils.fetchMember(user.id, message.guild);
		if (member) {
			const check = this.client.utils.checkPerms(member, message.member);
			if (check) return message.util.send(check.replace("{TYPE}", "reset the xp/levels"));
		}

		const emojis = [
			this.client.utils.emojiFinder("greentick"),
			this.client.utils.emojiFinder("redtick"),
		];
		const msg = await message.channel.send("Are you sure you want to reset this users xp?");
		emojis.forEach((e) => msg.react(e).catch((e) => null));

		const filter = (r: MessageReaction, u: User) =>
			u.id === message.author.id && emojis.includes(r.emoji.toString());
		const res = await this.client.utils.awaitReactions(msg, filter);
		if (!res || res.first()?.emoji.toString() === this.client.utils.emojiFinder("redtick"))
			return msg.delete();

		await Level.findOneAndDelete({ userId: user.id, guildId: message.guild.id });
		msg.edit("Successfully deleted their xp + level.");
		msg.reactions.removeAll();

		this.client.log("INFO", `User XP (${member.user.tag} / ${member.user.id}) reset by by ${message.author.tag} / ${message.author.id}`);
	}
}
