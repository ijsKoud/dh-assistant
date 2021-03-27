import { MessageEmbed, Message, User } from "discord.js";
import dhClient from "../client/client";
import GiveawayData from "../model/giveaway/Giveaway";
import { iGiveaway } from "../model/interfaces";

export default class Giveaway {
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
			if (!channel) return null;

			const message = await channel.messages.fetch(data.messageId);
			if (!message || !message.editable) return null;

			const guild = this.client.guilds.cache.get(data.guildId);
			if (!guild) return null;

			return setTimeout(async () => {
				try {
					let reaction = message.reactions.cache.find((r) => r.emoji.name === "🎉");
					if (reaction.partial) reaction = await reaction.fetch();

					let valid = await reaction.users.fetch();
					let users: User[] = [];
					for (let i = 0; i < data.winners; i++) {
						let user = valid.filter((u) => !u.bot || !u.system)?.random();
						while (
							data.requiredRole &&
							(await this.client.utils.fetchMember(user.id, guild)).roles.cache.has(
								data.requiredRole
							)
						) {
							valid = valid.filter(({ id }) => id === user.id);
							users.push(user);
						}
					}

					users = users.filter((u) => u !== undefined);

					let msg: Message = message;
					if (msg.partial) msg = await msg.fetch().catch((e) => null);
					if (!msg) return;

					await message.edit(
						new MessageEmbed(msg.embeds[0])
							.setColor(this.client.colours.green)
							.setDescription(
								`**Winners**:\n${
									users.map((u) => u.toString()).join("\n") ||
									"I was unable to determine the winner(s)"
								}`
							)
					);
				} catch (e) {
					this.client.log("ERROR", `Giveaway#setGiveaway() error: \`\`\`${e}\`\`\``);
				}
			}, data.date - Date.now());
		} catch (e) {
			this.client.log("ERROR", `Giveaway#setGiveaway() error: \`\`\`${e}\`\`\``);
			return null;
		}
	}
}
