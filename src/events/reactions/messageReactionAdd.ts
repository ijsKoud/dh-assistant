import { Listener } from "discord-akairo";
import { User } from "discord.js";
import { MessageReaction } from "discord.js";
import feedback from "../../models/feedback";
import feedbackBlacklist from "../../models/feedbackBlacklist";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { eventsChannel, pingChannel } from "../../client/config";
import { MessageEmbed } from "discord.js";

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

		const schema = await feedback.findOne({ guildId: reaction.message.guild.id });
		const blacklist = await feedbackBlacklist.findOne({ userId: user.id });
		if (!schema || blacklist) return;

		const id = schema.get("message");
		if (reaction.message.channel.id === pingChannel) return this.ping(reaction, user);
		if (user.bot || user.system) return;

		if (reaction.message.id !== id || reaction.emoji.name !== "📋") return;

		try {
			const msg = await user.send(`> ⏳ | Searching for your feedback... please wait.`);
			const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
			doc.useApiKey(process.env.API_KEY);

			await doc.loadInfo();
			const sheet = doc.sheetsByIndex[0];
			const rows = await sheet.getRows();
			const data = rows.find((r) => r.discordID == user.id);
			const state = rows.find((r) => r.discordID == user.id);
			const feedback = data
				? `> 📋 | You **${state.passed}** this application session, here is your feedback: \`\`\`${
						(data.feedback as string).length > 850
							? (data.feedback as string).substr(0, 850 - 3) + "..."
							: (data.feedback as string)
				  }\`\`\` ❓ | Questions about the feedback? Open a ticket with the topic \`feedback question\` and a staff member will help you as soon as possible.`
				: "> 👤 | Sorry I didn't find your user id in the database, if you think I am wrong, please open a ticket and the staff team is happy to help!";

			return msg.edit(feedback);
		} catch (e) {
			return this.client.log(`⚠ | Reaction Role Error - (${user.toString()}): \`${e}\``);
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
				const channel = await this.client.utils.getChannel(eventsChannel);
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
}
