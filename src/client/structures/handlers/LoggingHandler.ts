import { WebhookClient, MessageEmbed, Collection } from "discord.js";
import Client from "../../../client/Client";

interface iMessages {
	messages: MessageEmbed[];
	webhookUrl: string;
}

export default class LoggingHandler {
	public messages = new Collection<string, iMessages>();
	public timeouts = new Collection<string, NodeJS.Timeout>();

	constructor(public client: Client) {}

	public sendLogs(embed: MessageEmbed, type: string, wbUrl: string) {
		const collection = this.messages.get(type) || { messages: [], webhookUrl: "" };
		collection.messages.push(embed);
		collection.webhookUrl = wbUrl;

		this.messages.set(type, collection);
		this.setTimeout(type);
	}

	private setTimeout(type: string) {
		if (!this.timeouts.has(type)) {
			const timeout = setTimeout(() => this.sendRequest(type), 2e3);
			this.timeouts.set(type, timeout);
		}
	}

	private async sendRequest(type: string) {
		const collection = this.messages.get(type);
		if (!collection) return;

		this.messages.delete(type);
		this.timeouts.delete(type);

		const { messages, webhookUrl } = collection;

		try {
			const chunkSize = 10;
			const groups = messages
				.map((_, i) => (i % chunkSize === 0 ? messages.slice(i, i + chunkSize) : null))
				.filter((e) => e) as MessageEmbed[][];

			const embeds: MessageEmbed[][] = [];
			groups.forEach((g) => {
				let count = 0;
				let arr: MessageEmbed[] = [];

				g.forEach((m) => {
					count += m.length;
					if (count >= 6e3) {
						embeds.push(arr);
						count = m.length;
						arr = [m];
					} else {
						arr.push(m);
					}
				});

				embeds.push(arr);
			});

			const webhook = new WebhookClient({ url: webhookUrl });
			await Promise.all(
				embeds.map(
					async (embed) =>
						await webhook
							.send({
								avatarURL: this.client.user?.displayAvatarURL({ size: 4096 }),
								embeds: embed,
							})
							.catch((e) => this.client.loggers.get("bot")?.fatal("**LoggingHandler Error**:", e))
				)
			);
		} catch (e) {}
	}
}
