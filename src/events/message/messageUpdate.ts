import { Listener } from "discord-akairo";
import { Message } from "discord.js";

export default class messageUpdateListener extends Listener {
	constructor() {
		super("messageUpdate", {
			emitter: "client",
			event: "messageUpdate",
		});
	}

	async exec(oldMessage: Message, newMessage: Message) {
		try {
			if (newMessage.partial) newMessage = await newMessage.fetch();
			if (oldMessage.partial) {
				oldMessage = await oldMessage.fetch();
				oldMessage.content = "unkown";
			}
			if (newMessage.author.partial) {
				newMessage.author = await newMessage.author.fetch();
				oldMessage.author = newMessage.author;
			}

			if (
				newMessage.author.bot ||
				newMessage.system ||
				newMessage.webhookID ||
				oldMessage.content === newMessage.content
			)
				return;
			if (
				newMessage.guild.automod &&
				!newMessage.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true })
			)
				this.client.automod.check(newMessage, newMessage.guild.automod);

			this.client.loggingHandler.messageUpdate(oldMessage, newMessage);
		} catch (e) {
			this.client.log("ERROR", `messageUpdateListener Error: \`\`\`${e.stack || e.message}\`\`\``);
		}
	}
}
