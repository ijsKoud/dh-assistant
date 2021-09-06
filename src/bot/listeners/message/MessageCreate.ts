import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Message } from "discord.js";

@ApplyOptions<ListenerOptions>({ event: "messageCreate" })
export default class MessageCreateListener extends Listener {
	public async run(message: Message) {
		const { client } = this.container;

		if (
			!message.content.startsWith(client.options.defaultPrefix?.toString() ?? "") &&
			!client.levelManager.lvlBlacklisted.includes(message.channel.id) &&
			message.guild
		) {
			const id = `${message.author.id}-${message.guild.id}`;
			const data =
				(await client.prisma.level.findFirst({ where: { id } })) ||
				(await client.levelManager.createUser(message.author.id, message.guild.id));
			const lvl = await client.levelManager.updateUser(message.author.id, message.guild.id, {
				...data,
				xp: client.levelManager.generateXP(data.xp, client.multipliers.get(message.author.id) ?? 1),
			});

			if (lvl?.lvlUp && message.member) {
				await client.levelManager.rankUser(message.member, {
					...lvl.lvl,
					level: lvl.lvl.level + 1,
				});

				await message.reply({
					allowedMentions: { repliedUser: true },
					content: `Congratulations **${message.author.tag}**, you have got level **${
						lvl.lvl.level + 1
					}**!`,
				});
			}
		}
	}
}
