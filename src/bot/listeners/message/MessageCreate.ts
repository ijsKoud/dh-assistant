import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Message } from "discord.js";

@ApplyOptions<ListenerOptions>({ event: "messageCreate" })
export default class MessageCreateListener extends Listener {
	public async run(message: Message) {
		const { client } = this.container;
		if (message.author.bot || message.system || message.webhookId) return;

		client.automod.run(message);
		this.handleLeveling(message);
		this.handleTickets(message);
	}

	private async handleTickets(message: Message) {
		const { client } = this.container;

		if (
			/<((@!?\d+)|(:.+?:\d+))>/g.test(message.content.trim().split(/ +/g)[0] ?? "") &&
			message.mentions.members?.has(client.user?.id ?? "") &&
			message.content.trim().split(/ +/g).length === 1 &&
			message.guild
		)
			return client.ticketHandler.handleMention(message);

		if (message.channel.type === "DM" || message.channel.name.startsWith("ticket-"))
			await client.ticketHandler.handleMessage(message);
	}

	private async handleLeveling(message: Message) {
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
				await client.levelManager.rankUser(message.member, lvl.lvl);

				await message
					.reply({
						allowedMentions: { repliedUser: true },
						content: `Congratulations **${message.author.tag}**, you have got level **${lvl.lvl.level}**!`,
					})
					.catch(() => void 0);
			}
		}
	}
}
