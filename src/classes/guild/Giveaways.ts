import { MessageReaction } from "discord.js";
import { MessageEmbed, Message, User, Collection, Guild } from "discord.js";
import dhClient from "../../client/client";
import GiveawayData from "../../models/giveaway/Giveaway";
import { iGiveaway } from "../../models/interfaces";

export default class Giveaway {
	public cache = new Map<string, NodeJS.Timeout>();

	constructor(private client: dhClient) {}

	public async loadAll() {
		try {
			const data = await GiveawayData.find();
			if (!data) return;

			data.forEach((d) => this.setGiveaway(d));
		} catch (e) {
			this.client.log("ERROR", `Giveaway#loadAll() error: \`\`\`${e}\`\`\``);
		}
	}

	public async setGiveaway(data: iGiveaway): Promise<NodeJS.Timeout> {
		try {
			const channel = await this.client.utils.getChannel(data.channelId);
			if (!channel) {
				console.log("no channel", channel, data);
				return null;
			}

			const message = await channel.messages.fetch(data.messageId);
			if (!message || !message.editable) {
				console.log("no message");
				return null;
			}

			const guild = this.client.guilds.cache.get(data.guildId);
			if (!guild) {
				console.log("no guild");
				return null;
			}

			const timeout = setTimeout(async () => {
				try {
					let reaction = message.reactions.cache.find((r) => r.emoji.name === "🎉");
					if (reaction.partial) reaction = await reaction.fetch();

					const users = await this.getWinners(reaction, guild, data);

					let msg: Message = message;
					if (msg.partial) msg = await msg.fetch().catch((e) => null);
					if (!msg) return console.log("no message found");

					const embed = new MessageEmbed(msg.embeds[0]).setColor("#51F2AF");
					if (embed.fields.find((f) => f.name === "• Winners"))
						embed.fields.find((f) => f.name === "• Winners").value =
							users.map((u) => u.toString()).join("\n") ||
							"I was unable to determine the winner(s)";
					else
						embed.addField(
							"• Winners",
							users.map((u) => u.toString()).join("\n") || "I was unable to determine the winner(s)"
						);
					await message.edit(embed);

					await msg.channel.send(
						users?.length
							? `🎉'Congrats ${users.map((u) => u?.toString?.()).join(", ")}, you won **${
									msg.embeds[0]?.fields?.find((f) => f.name === "• Prize")?.value || "unkown"
							  }**.`
							: `😢 No one wanted to enter this giveaway.`
					);
					this.delete(data);
				} catch (e) {
					this.client.log("ERROR", `Giveaway#setGiveaway() error: \`\`\`${e.stack}\`\`\``);
				}
			}, data.date - Date.now());

			this.cache.set(message.id, timeout);
			return timeout;
		} catch (e) {
			this.client.log("ERROR", `Giveaway#setGiveaway() error: \`\`\`${e.stack}\`\`\``);
			return null;
		}
	}

	public async getWinners(
		reaction: MessageReaction,
		guild: Guild,
		data: iGiveaway
	): Promise<User[]> {
		let valid = (await this.parseMember(await reaction.users.fetch(), guild))
			?.filter((u) => !u?.user?.bot)
			.filter((x) => x !== null);

		if (data.requiredRole) valid = valid.filter((u) => u.roles.cache.has(data.requiredRole));
		let users: User[] = [];

		if (valid?.length)
			for (let i = 0; i < data.winners; i++) {
				let random = Math.floor(Math.random() * users.length);
				let user = valid[random];

				valid = valid.filter((u) => u?.id !== user.id);
				users.push(user?.user);
			}

		users = users.filter((u) => u !== undefined);
		return users ?? [];
	}
	public async delete(data: any) {
		data
			?.deleteOne?.()
			?.catch?.((e: Error) =>
				this.client.log("ERROR", `Giveaway#delete() error: \`\`\`${e}\`\`\``)
			);

		clearTimeout(this.cache.get(data?.messageId));
		this.cache.delete(data?.messageId);
	}

	public async parseMember(users: Collection<string, User>, guild: Guild) {
		const members = await guild.members.fetch();
		return users.map(({ id }) => members.get(id));
	}
}
