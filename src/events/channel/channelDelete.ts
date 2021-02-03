import moment from "moment";
import { Listener } from "discord-akairo";
import { GuildChannel, MessageEmbed, MessageAttachment } from "discord.js";
import { transcriptsId } from "../../client/config";
import ticket from "../../models/tickets";
import { unlink } from "fs/promises";

export default class channelDelete extends Listener {
	constructor() {
		super("channelDelete", {
			category: "client",
			emitter: "client",
			event: "channelDelete",
		});
	}

	async exec(channel: GuildChannel) {
		if (channel.type !== "text" || channel.name !== "ticket") return;
		if (channel.guild.id !== process.env.GUILD) return;

		const schema = await ticket.findOne({ channelId: channel.id });
		if (!schema) return;

		const user = await this.client.utils.fetchUser(schema.get("userId"));
		if (user)
			user
				.send(
					">>> 👍 | Your ticket is now closed, thanks for getting in touch! \n❓ | Questions? Don't hesitate to contact us again, we are always happy to help!\n\nIf you have time, please give our staff team some feedback: https://forms.gle/CbEVRuGPywjZausd9"
				)
				.catch((e) => null);

		const transcripts = await this.client.utils.getChannel(transcriptsId);

		if (transcripts)
			transcripts.send(
				new MessageEmbed()
					.setColor("#9295F8")
					.setTitle(`Ticket Transcription - ${moment(Date.now()).format("MMMM Do YYYY hh:mm:ss")}`)
					.setDescription(
						`**Ticket Owner**: <@${schema.get("userId")}>\n**Ticket Claimer**: <@${schema.get(
							"claimerId"
						)}>`
					)
					.attachFiles([
						new MessageAttachment(
							`transcriptions/${schema.get("userId")}-ticket.txt`,
							`${schema.get("userId")}-ticket.txt`
						),
					])
			);
		schema.delete();
		setTimeout(() => unlink(`transcriptions/${schema.get("userId")}-ticket.txt`), 5000);
	}
}
