import { Listener } from "discord-akairo";
import { Message, User } from "discord.js";
import { MessageReaction } from "discord.js";
import Feedback from "../../model/bot/Feedback";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { MessageEmbed } from "discord.js";
import Ticket from "../../model/tickets/Ticket";
import botBlacklist from "../../model/bot/botBlacklist";

export default class messageReactionAdd extends Listener {
	constructor() {
		super("messageReactionAdd", {
			category: "client",
			emitter: "client",
			event: "messageReactionAdd",
		});
	}

	async exec(reaction: MessageReaction, user: User) {
		if (reaction.partial) reaction = await reaction.fetch();
		if (reaction.message.partial) reaction.message = await reaction.message.fetch();
		if (user.partial) user = await user.fetch();

		if (!reaction.message.guild) return;
		if (user.bot || user.system) return;

		if (reaction.message.channel.id === this.client.config.cet.ping)
			return this.ping(reaction, user);
		if (reaction.message.channel.id === "710223624442871970") return this.adrequest(reaction, user);

		if (reaction.emoji.name === "📋") this.feedback(reaction.message, user);

		try {
			let message = reaction.message;

			if (
				reaction.emoji.name !== "✔" ||
				user.system ||
				user.bot ||
				message.channel.id !== this.client.config.tickets.claim
			)
				return;

			const ticket = await Ticket.findOne({ messageId: message.id });
			if (!ticket) return;

			const channel = await message.guild.channels.create("ticket", {
				type: "text",
				parent: this.client.config.tickets.category,
				permissionOverwrites: [
					{
						id: message.guild.id,
						deny: ["VIEW_CHANNEL"],
					},
					{
						id: this.client.user.id,
						allow: [
							"VIEW_CHANNEL",
							"ADD_REACTIONS",
							"EMBED_LINKS",
							"SEND_MESSAGES",
							"ATTACH_FILES",
							"MANAGE_MESSAGES",
						],
					},
					{
						id: user.id,
						allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
					},
					{
						id: "791638446207926324",
						allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
					},
				],
			});

			ticket.channelId = channel.id;
			ticket.claimerId = user.id;
			ticket.status = "open";
			await ticket.save();

			const embed = message.embeds[0];
			const ticketOwner = await this.client.utils.fetchUser(ticket.userId);
			channel
				.send(
					new MessageEmbed()
						.setTitle(`ticket - ${ticketOwner.tag}`)
						.setDescription(embed.description)
						.setFooter(`Claimed by ${user.tag}`)
						.setColor(this.client.hex)
				)
				.then((m) => m.pin().catch((e) => null));

			message.delete();
		} catch (e) {
			this.client.log("ERROR", `Reaction add event error: \`\`\`${e}\`\`\``);
		}
	}

	async feedback(message: Message, user: User) {
		const config = await Feedback.findOne({ guildId: message.guild.id });
		if (!config || message.id !== config.message) return;

		if (user.feedbackBlacklisted || (await botBlacklist.findOne({ userId: user.id })))
			return user
				.send(
					"Sorry, you aren't allowed to see your feedback. Please don't try to break our system, because this is the consequence."
				)
				.catch((e) => null);

		const msg: Message = await user
			.send(
				`>>> ${this.client.utils.emojiFinder(
					"loading"
				)} | Searching for your feedback, please wait...`
			)
			.catch((e) => null);
		if (!message) return;

		try {
			const doc = new GoogleSpreadsheet(process.env.SHEET);
			doc.useApiKey(process.env.API_KEY);
			await doc.loadInfo();

			const sheet = doc.sheetsByIndex[0];
			const rows = await sheet.getRows();
			const data = rows.find((r) => r.discordID == user.id);
			const state = rows.find((r) => r.discordID == user.id);

			if (data && (!state || !state.passed || !state.feedback))
				throw new Error("Missing `state`, `state.data` or `state.feedback` property.");
			const feedback = data
				? `>>> ${"📖"} | You **${
						state.passed
				  }** this application session, here is your feedback: \`\`\`${
						(data.feedback as string).length > 850
							? (data.feedback as string).substr(0, 850 - 3) + "..."
							: (data.feedback as string)
				  }\`\`\` ❓ | Questions about the feedback? Open a ticket with the topic \`feedback question\` and a staff member will help you as soon as possible.`
				: ">>> 👤 | Sorry I didn't find your user id in the database, if you think I am wrong, please open a ticket and the staff team is happy to help!";

			msg.edit(feedback);
		} catch (e) {
			this.client.log("ERROR", `Feedback error (${user.id} - ${user.tag}): \`\`\`${e}\`\`\``);
		}
	}

	async ping(reaction: MessageReaction, user: User) {
		const { message } = reaction;
		if (!message.author.bot) return;
		if (message.embeds.length === 0) return;

		switch (`<:${reaction.emoji.identifier}>`) {
			case this.client.utils.emojiFinder("greentick"):
				message.edit(
					new MessageEmbed(message.embeds[0].spliceFields(0, message.embeds[0].fields.length))
						.addField("Granted by:", user.toString())
						.setColor("#51F2AF")
				);
				message.reactions.removeAll();
				const channel = await this.client.utils.getChannel(this.client.config.cet.public);
				channel.send("🔼 New event announcement/information! <@&702176526795276349>");
				break;
			case this.client.utils.emojiFinder("redtick"):
				message.edit(
					new MessageEmbed(message.embeds[0].spliceFields(0, message.embeds[0].fields.length))
						.addField("Denied by:", user.toString())
						.setColor("#DB5D57")
				);
				message.reactions.removeAll();
				break;
			default:
				break;
		}
	}

	async adrequest(reaction: MessageReaction, user: User) {
		const { message } = reaction;
		if (!message.author.bot) return;
		if (message.embeds.length === 0) return;

		switch (`<:${reaction.emoji.identifier}>`) {
			case this.client.utils.emojiFinder("greentick"):
				message.edit(
					new MessageEmbed(message.embeds[0])
						.addField("Granted by:", user.toString())
						.setColor("#51F2AF")
				);
				message.reactions.removeAll();
				const channel = await this.client.utils.getChannel("720986432176652369");
				channel.send(
					`>>> 💰 | Ad - ${message.embeds[0].fields.find((f) => f.name === "User").value}\n${
						message.embeds[0].description
					}`,
					{ allowedMentions: { users: [], roles: [] } }
				);
				break;
			case this.client.utils.emojiFinder("redtick"):
				message.edit(
					new MessageEmbed(message.embeds[0])
						.addField("Denied by:", user.toString())
						.setColor("#DB5D57")
				);
				message.reactions.removeAll();
				message.channel.send(`${user.toString()}, ad request denied: please provide a reason.`);
				const collector = await this.client.utils.awaitMessages(
					message,
					(m: Message) => m.author.id === user.id
				);
				const u = await this.client.utils.fetchUser(
					message.embeds[0].fields.find((f) => f.name === "User").value.split(/ +/g)[1]
				);

				this.client.commandHandler.cooldowns.get(message.author.id)["adrequest"] = null;

				await u.send(
					`Your ad request status update: **denied**\n${
						collector?.first()?.content || "No reason provided."
					}`,
					{ split: true }
				);
				break;
			default:
				break;
		}
	}
}
