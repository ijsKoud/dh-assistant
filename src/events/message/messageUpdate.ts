import { Message, MessageEmbed } from "discord.js";
import { Listener } from "discord-akairo";
import { WebhookClient } from "discord.js";

const types = {
	spam: "spam",
	blacklisted: "use blacklisted words",
	mention: "mass mention users",
};

const webhook = new WebhookClient(process.env.MESSAGE_ID, process.env.MESSAGE_TOKEN);
export default class messageUpdateEvent extends Listener {
	constructor() {
		super("messageUpdate", {
			emitter: "client",
			event: "messageUpdate",
		});
	}

	async exec(oldMessage: Message, newMessage: Message) {
		if (oldMessage.partial) oldMessage = await oldMessage.fetch();
		if (newMessage.partial) newMessage = await newMessage.fetch();

		const message = newMessage;
		if (message.channel.type === "dm") return;
		if (message.guild.id !== process.env.GUILD) return;
		await message.channel.fetch();

		if (
			message.partial ||
			message.author.bot ||
			message.system ||
			message.webhookID ||
			oldMessage.content === newMessage.content
		)
			return;

		if (!message.guild || message.author.bot || message.system) return;
		if (!this.client.config.whitelistedChannels.includes(message.channel.id))
			webhook.send(
				new MessageEmbed()
					.setTimestamp()
					.setColor("#4389F0")
					.setFooter("updated at")
					.setAuthor(
						message.author.tag,
						message.author.displayAvatarURL({ dynamic: true, size: 4096 })
					)
					.setTitle(`Message updated in #${message.channel.name}`)
					.setURL(message.url)
					.setDescription(
						`**Before**: ${
							oldMessage.content.length > 800
								? oldMessage.content.substr(0, 800) + "..."
								: oldMessage.content
						}` +
							"\n" +
							`**After**: ${
								newMessage.content.length > 800
									? newMessage.content.substr(0, 800) + "..."
									: newMessage.content
							}`
					)
			);

		if (
			message.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true }) ||
			this.client.isOwner(message.author.id)
		)
			return;

		const automod = this.client.automod.check(message);
		automod.forEach(async (w) => {
			if (w.type === "capabuse")
				return message.channel
					.send(`Hey ${message.author.toString()}, **${w.reason}**`)
					.then((m) => m.delete({ timeout: 5e3 }));

			try {
				const caseId = await this.client.automod.warn(message.member, message.guild.me, w.reason);
				await message.member
					.send(
						this.client.tagscript(
							this.client.messages.DM +
								"\n\n❗ | This warning is registered under the id `{CASE_ID}`",
							{
								TYPE: "warning",
								GUILD: message.guild.name,
								CASE_ID: caseId,
								reason: w.reason.substr(0, 1900),
							}
						)
					)
					.catch((e) => null);

				message.channel
					.send(
						`Hey ${message.author.toString()}, you aren't allowed to **${types[w.type]}** here!`
					)
					.then((m) => m.delete({ timeout: 5e3 }))
					.catch((e) => null);
				message.delete().catch((e) => null);
			} catch (e) {
				this.client.log("ERROR", `Automod error: \`\`\`${e}\`\`\``);
			}
		});
	}
}
