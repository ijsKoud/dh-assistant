import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage } from "../../../client/structures/Moderation";
import { Message } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "qotd",
	aliases: ["fotd"],
	description: "Post a QOTD/FOTD embed in the QOTD/FOTD channel",
	preconditions: ["GuildOnly", "ManagerOnly"]
})
export default class QotdCommand extends Command {
	public async messageRun(message: GuildMessage) {
		const filter = (m: Message) => m.author.id === message.author.id;

		const base = ">>> ❓ | **QOTD Command**:\n";
		let msg: Message = await message.channel.send(`${base}Please give me the QOTD including the user (<qotd> ~ <user>)`);
		let collector = (await this.client.utils.awaitMessages(msg, { filter }))?.first();

		// QOTD
		if (!collector) return msg.edit(`${base}Prompt closed - no response`);
		const qotd = collector.content;
		if (!qotd || !qotd.includes("~")) return msg.edit(`${base}Prompt closed - invalid QOTD provided.`);
		if (collector.content.match(/cancel/g)) return msg.edit(`${base}Prompt closed - cancellation request.`);

		// FOTD
		msg = await message.channel.send(`${base}Please give me the FOTD including the user (<qotd> ~ <user>)`);
		collector = (await this.client.utils.awaitMessages(msg, { filter }))?.first();
		if (!collector) return msg.edit(`${base}Prompt closed - no response`);
		const fotd = collector.content;
		if (!fotd || !fotd.includes("~")) return msg.edit(`${base}Prompt closed - invalid FOTD provided.`);
		if (collector.content.match(/cancel/g)) return msg.edit(`${base}Prompt closed - cancellation request.`);

		// Source
		msg = await message.channel.send(`${base}Please give me the Source of the FOTD (excluding the 'source:')`);
		collector = (await this.client.utils.awaitMessages(msg, { filter }))?.first();
		if (!collector) return msg.edit(`${base}Prompt closed - no response`);
		const source = collector.content;
		if (!source) return msg.edit(`${base}Prompt closed - no source provided.`);
		if (collector.content.match(/cancel/g)) return msg.edit(`${base}Prompt closed - cancellation request.`);

		// confirmation
		msg = await message.channel.send({
			content:
				base +
				[
					`**QOTD**: ${qotd}`,
					`**FOTD**: ${fotd}`,
					`**Source**: \`${source}\``,
					"Say **yes** to confirm that this is correct, say **no** to cancel."
				].join("\n"),
			allowedMentions: { roles: [], users: [] }
		});
		collector = (await this.client.utils.awaitMessages(msg, { filter }))?.first();
		if (!collector || !collector?.content) return msg.edit(`${base}Prompt closed - no response`);
		if (!collector.content.match(/yes/g)) return msg.edit(`${base}Prompt closed - cancellation request.`);

		await this.postQOTD(message, qotd, fotd, source);
		await message.reply(`${base}QOTD posted and published!`);
	}

	private async postQOTD(message: Message, qotd: string, fotd: string, source: string) {
		const channel = await this.client.utils.getChannel(this.client.constants.channels.qotdChannel);
		if (!channel || !channel.isText()) throw new Error("Invalid QOTD channel provided");

		const embed = this.client.utils
			.embed()
			.setTitle("Question of the Day & Fact of the Day!")
			.setFooter(`Source: ${source} ~ Embed sent by ${message.author.username}`)
			.setDescription(["QOTD", qotd, "FOTD", fotd, "_Don't forget to leave your responses in_\n<#702174849283522661>"].join("\n\n"));

		const msg = await channel.send({
			content: "<@&849732197023350804> :arrow_down:",
			embeds: [embed]
		});
		if (msg.crosspostable) await msg.crosspost().catch(() => void 0);
	}
}
