import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import type { GuildMessage } from "../../../client/structures/Moderation";
import type { Message, TextChannel } from "discord.js";
import ms from "ms";

@ApplyOptions<Command.Options>({
	name: "gstart",
	aliases: ["giveawaystart"],
	description: "Start a giveaway",
	preconditions: ["GuildOnly", "ManagerOnly"]
})
export default class GstartCommand extends Command {
	public async messageRun(message: GuildMessage) {
		const filter = (m: Message) => m.author.id === message.author.id;

		const base = ">>> 🎉 | **Giveaway Setup**:\n";
		let msg: Message = await message.channel.send(`${base}Please specify a giveaway channel (mention/id)`);
		let collector = (await this.client.utils.awaitMessages(msg, { filter }))?.first();

		// channel
		if (!collector) return msg.edit(`${base}Prompt closed - no response`);
		const channel = await this.client.utils.getChannel(this.getArg(collector?.content));
		if (!channel || !channel.isText() || channel.type !== "GUILD_TEXT") return msg.edit(`${base}Prompt closed - invalid channel provided.`);
		if (collector.content.match(/cancel/g)) return msg.edit(`${base}Prompt closed - cancellation request.`);

		// prize
		msg = await message.channel.send(`${base}What is the prize for this giveaway? (ex: nitro classic 1 month)`);
		collector = (await this.client.utils.awaitMessages(msg, { filter }))?.first();
		if (!collector) return msg.edit(`${base}Prompt closed - no response`);
		const prize = collector?.content;
		if (!prize) return msg.edit(`${base}Prompt closed - invalid prize provided.`);
		if (collector.content.match(/cancel/g)) return msg.edit(`${base}Prompt closed - cancellation request.`);

		// duration
		msg = await message.channel.send(`${base}How long is this giveaway going to take (ex: 1d 2h 3m 4s)`);
		collector = (await this.client.utils.awaitMessages(msg, { filter }))?.first();
		if (!collector) return msg.edit(`${base}Prompt closed - no response`);
		const duration = ms(collector?.content ?? "");
		if (!duration || isNaN(duration)) return msg.edit(`${base}Prompt closed - invalid duration provided.`);
		if (collector.content.match(/cancel/g)) return msg.edit(`${base}Prompt closed - cancellation request.`);

		// winners
		msg = await message.channel.send(`${base}How many winners are there? (minimum is 1 winner)`);
		collector = (await this.client.utils.awaitMessages(msg, { filter }))?.first();
		if (!collector) return msg.edit(`${base}Prompt closed - no response`);
		const winners = Number(this.getArg(collector?.content)) < 1 ? 1 : Number(this.getArg(collector?.content));
		if (!winners) return msg.edit(`${base}Prompt closed - invalid amount of winners provided.`);
		if (collector.content.match(/cancel/g)) return msg.edit(`${base}Prompt closed - cancellation request.`);

		// required role
		msg = await message.channel.send(`${base}What is the required role? You can mention it or provide the id/name (ex: everyone)`);
		collector = (await this.client.utils.awaitMessages(msg, { filter }))?.first();
		if (!collector || !collector?.content) return msg.edit(`${base}Prompt closed - no response`);
		const requiredRole = await this.client.utils.getRole(this.getArg(collector.content), message.guild);
		if (!requiredRole) return msg.edit(`${base}Prompt closed - invalid role provided.`);
		if (collector.content.match(/cancel/g)) return msg.edit(`${base}Prompt closed - cancellation request.`);

		// confirmation
		msg = await message.channel.send({
			content:
				base +
				[
					`**Channel**: ${channel.toString()}`,
					`**Prize**: ${prize}`,
					`**Duration**: \`${ms(duration)}\``,
					`**Winners**: ${winners}`,
					`**Required Role**: ${requiredRole.toString()}\n`,
					"Say **yes** to confirm that this is correct, say **no** to cancel."
				].join("\n"),
			allowedMentions: { roles: [], users: [] }
		});
		collector = (await this.client.utils.awaitMessages(msg, { filter }))?.first();
		if (!collector || !collector?.content) return msg.edit(`${base}Prompt closed - no response`);
		if (!collector.content.match(/yes/g)) return msg.edit(`${base}Prompt closed - cancellation request.`);

		// @ts-ignore channel types not compatible because of different Djs version
		await this.client.giveawaysManager.start(channel as TextChannel, {
			prize,
			duration,
			winnerCount: winners,
			hostedBy: message.author,
			exemptMembers: (member) => !member.roles.cache.has(requiredRole.id),
			allowedMentions: {},
			messages: {
				winMessage:
					">>> 🥳 | Congratulations, {winners}! You won **{this.prize}**!\nPlease DM the giveaway **{this.hostedBy}** to claim your price!!\n\nReference: {this.messageURL}"
			}
		});

		return message.reply(`${base}Setup completed, giveaway created!`);
	}

	private getArg(str: string): string {
		return str?.split(" ")[0];
	}
}
