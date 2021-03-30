import { MessageEmbed, Message } from "discord.js";
import { Command } from "discord-akairo";
import Giveaway from "../../model/giveaway/Giveaway";
import ms from "ms";

export default class gstartCommand extends Command {
	constructor() {
		super("gstart", {
			aliases: ["gstart", "gcreate"],
			clientPermissions: ["EMBED_LINKS", "ADD_REACTIONS", "MENTION_EVERYONE"],
			userPermissions: ["MANAGE_GUILD"],
			description: {
				content: "Starts a giveaway",
				usage: "gstart <...prompt>",
			},
			cooldown: 2e3,
		});
	}

	async exec(message: Message) {
		const filter = (m: Message) => m.author.id === message.author.id;

		let base = ">>> 🎉 | **Giveaway Setup**:\n";
		let msg: Message = await message.channel.send(
			base + "Please specify a giveaway channel (mention/id)"
		);
		let collector = (await this.client.utils.awaitMessages(msg, filter))?.first();

		// channel
		if (!collector) return msg.edit(base + "Prompt closed - no response");
		const channel = await this.client.utils.getChannel(this.getArg(collector?.content));
		if (!channel || channel.type !== "text")
			return msg.edit(base + "Prompt closed - invalid channel provided.");
		if (collector.content.match(/cancel/g))
			return msg.edit(base + "Prompt closed - cancellation request.");

		// prize
		msg = await message.channel.send(
			base + "What is the prize for this giveaway? (ex: nitro classic 1 month)"
		);
		collector = (await this.client.utils.awaitMessages(msg, filter))?.first();
		if (!collector) return msg.edit(base + "Prompt closed - no response");
		const prize = collector?.content;
		if (!prize) return msg.edit(base + "Prompt closed - invalid prize provided.");
		if (collector.content.match(/cancel/g))
			return msg.edit(base + "Prompt closed - cancellation request.");

		// duration
		msg = await message.channel.send(
			base + "How long is this giveaway going to take (ex: 1d 2h 3m 4s)"
		);
		collector = (await this.client.utils.awaitMessages(msg, filter))?.first();
		if (!collector) return msg.edit(base + "Prompt closed - no response");
		const duration = ms(collector?.content || "");
		if (!duration || isNaN(duration))
			return msg.edit(base + "Prompt closed - invalid duration provided.");
		if (collector.content.match(/cancel/g))
			return msg.edit(base + "Prompt closed - cancellation request.");

		// winners
		msg = await message.channel.send(base + "How many winners are there? (minimum is 1 winner)");
		collector = (await this.client.utils.awaitMessages(msg, filter))?.first();
		if (!collector) return msg.edit(base + "Prompt closed - no response");
		const winners =
			parseInt(this.getArg(collector?.content)) < 1 ? 1 : parseInt(this.getArg(collector?.content));
		if (!winners) return msg.edit(base + "Prompt closed - invalid amount of winners provided.");
		if (collector.content.match(/cancel/g))
			return msg.edit(base + "Prompt closed - cancellation request.");

		// required role
		msg = await message.channel.send(
			base + "What is the required role? You can mention it or provide the id/name (ex: everyone)"
		);
		collector = (await this.client.utils.awaitMessages(msg, filter))?.first();
		if (!collector || !collector?.content) return msg.edit(base + "Prompt closed - no response");
		const requiredRole =
			this.client.util.resolveRole(collector.content, message.guild.roles.cache, false, false) ||
			(await message.guild.roles.fetch(this.getArg(collector.content)));
		if (!requiredRole) return msg.edit(base + "Prompt closed - invalid role provided.");
		if (collector.content.match(/cancel/g))
			return msg.edit(base + "Prompt closed - cancellation request.");

		// confirmation
		msg = await message.channel.send(
			base +
				[
					`**Channel**: ${channel.toString()}`,
					`**Prize**: ${prize}`,
					`**Duration**: \`${ms(duration)}\``,
					`**Winners**: ${winners}`,
					`**Required Role**: ${requiredRole.toString()}\n`,
					`Say **yes** to confirm that this is correct, say **no** to cancel.`,
				].join("\n"),
			{ allowedMentions: { roles: [], users: [] } }
		);
		collector = (await this.client.utils.awaitMessages(msg, filter))?.first();
		if (!collector || !collector?.content) return msg.edit(base + "Prompt closed - no response");
		if (!collector.content.match(/yes/g))
			return msg.edit(base + "Prompt closed - cancellation request.");

		const date = Date.now() + duration;
		const giveawayMsg = await channel.send(
			new MessageEmbed()
				.setTitle(`Giveaway Time 🎉 - hosted by ${message.author.tag}`)
				.setDescription([
					`React with 🎉 to enter the giveaway! (${winners} winner(s))`,
					`The required role for this giveaway is **${
						requiredRole.name
					}** (${requiredRole.toString()})`,
				])
				.addField("• Prize", prize)
				.setFooter("Giveaway ends")
				.setTimestamp(date)
				.setColor(this.client.hex)
		);
		giveawayMsg.react("🎉");

		const data = await Giveaway.create({
			requiredRole: requiredRole.id,
			channelId: channel.id,
			guildId: message.guild.id,
			messageId: giveawayMsg.id,
			date,
			winners,
		});
		await this.client.giveaway.setGiveaway(data);

		await message.channel.send(
			base + `Setup completed, giveaway created - Id: \`${giveawayMsg.id}\``
		);
	}

	getArg(str: string): string {
		return str?.split(" ")?.shift();
	}
}
