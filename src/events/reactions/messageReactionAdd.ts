import { Listener } from "discord-akairo";
import { Message, User } from "discord.js";
import { MessageReaction } from "discord.js";
import Feedback from "../../models/bot/Feedback";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { MessageEmbed } from "discord.js";
import botBlacklist from "../../models/bot/botBlacklist";

export default class messageReactionAdd extends Listener {
	constructor() {
		super("messageReactionAdd", {
			emitter: "client",
			event: "messageReactionAdd",
		});
	}

	async exec(reaction: MessageReaction, user: User) {
		try {
			if (reaction.partial) reaction = await reaction.fetch();
			if (reaction.message.partial) reaction.message = await reaction.message.fetch();
			if (user.partial) user = await user.fetch();

			const { channel } = reaction.message;
			if (reaction.emoji.name === "✅" && channel.type === "text")
				await this.client.ticketHandler.handleReaction(reaction, user);

			if (reaction.emoji.name === "📋") return this.feedback(reaction.message, user);
			if (channel.id === "741659701804269608" && !user.bot) return this.ping(reaction, user);

			if (reaction.message.channel.id === "710223624442871970" && !user.bot)
				return this.adrequest(reaction, user);
		} catch (e) {
			this.client.log(
				"ERROR",
				`MessageReactionAdd event error: \`\`\`${e.stack || e.message}\`\`\``
			);
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
			.send(`>>> ${this.client.emoji.loading} | Searching for your feedback, please wait...`)
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
				? `>>> 📖 | You **${
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

		switch (reaction.emoji.toString()) {
			case this.client.emoji.greentick:
				message.edit(
					new MessageEmbed(message.embeds[0].spliceFields(0, message.embeds[0].fields.length))
						.addField("Granted by:", user.toString())
						.setColor("#51F2AF")
				);
				message.reactions.removeAll();
				const channel = await this.client.utils.getChannel("748653610098884760");
				channel.send("🔼 New event announcement/information! <@&702176526795276349>");
				break;
			case this.client.emoji.redcross:
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

		switch (reaction.emoji.toString()) {
			case this.client.emoji.greentick:
				await message.edit(
					new MessageEmbed(message.embeds[0])
						.addField("Granted by:", user.toString())
						.setColor("#51F2AF")
				);
				await message.reactions.removeAll();
				const channel = await this.client.utils.getChannel("720986432176652369");
				await channel.send(
					`>>> 💰 | Ad - ${message.embeds[0].fields.find((f) => f.name === "User").value}\n${
						message.embeds[0].description
					}`,
					{ allowedMentions: { users: [], roles: [] } }
				);
				break;
			case this.client.emoji.redcross:
				await message.edit(
					new MessageEmbed(message.embeds[0])
						.addField("Denied by:", user.toString())
						.setColor("#DB5D57")
				);
				await message.reactions.removeAll();
				await message.channel.send(
					`${user.toString()}, ad request denied: please provide a reason.`
				);
				const collector = await this.client.utils.awaitMessages(
					message,
					(m: Message) => m.author.id === user.id
				);
				const u = await this.client.utils.fetchUser(
					message.embeds[0].fields.find((f) => f.name === "User").value.split(/ +/g)[1]
				);

				await u
					.send(
						`Your ad request status update: **denied**\n${
							collector?.first()?.content || "No reason provided."
						}`,
						{ split: true }
					)
					.catch((e) => null);

				delete this.client.commandHandler.cooldowns.get(message.author.id)?.["adrequest"];
				break;
			default:
				break;
		}
	}
}
