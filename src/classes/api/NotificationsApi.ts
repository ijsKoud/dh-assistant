import YouTubeNotifier from "youtube-notification";
import dhClient from "../../client/client";
import express, { Express } from "express";
import { WebhookClient } from "discord.js";

export default class NotificationsApi {
	public channelIds = [
		"UCKiU0TIf9z_RV2jRe8wAgug",
		"UCkMrp3dJhWz2FcGTzywQGWg",
		"UCo3SvWfQGaKdKAE_b_hn-Sg",
		"UCtj4a6GdkoRRYnkKzf5S_Mw",
		"UCUzcruQJ-eqsSP_U4igNu6A",
		"UCp2yuh619SvvZow35rIymzA",
		"UCPCAmZwDZRxbDo_0P2QUMXQ",
	];
	public notifier: any;
	public server: Express;
	public port: number = Number(process.env.PORT || 3000);
	public links: string[] = [];

	public webhooks = {
		draavo: new WebhookClient(process.env.DRAAVO_ID, process.env.DRAAVO_TOKEN),
		senior: new WebhookClient(process.env.SENIOR_ID, process.env.SENIOR_TOKEN),
	};

	constructor(private client: dhClient) {
		this.server = express();
		this.server.get("/", (_, res) => res.status(200).send("API is online."));
	}

	public loadAll(): Express {
		this.notifier = new YouTubeNotifier({
			hubCallback: `http://85.214.166.129:${this.port}/yt`,
			secret: "ZeroTwoIsTheBest:D",
		});

		this.notifier.on("notified", (data: iData) => {
			if (this.links.includes(data.video.link))
				return this.client.log(
					"INFO",
					`Ignoring incoming POST request on port: \`${this.port}\` - channel: ${data.channel.name}`
				);
			this.links.push(data.video.link);

			if (["draavo", "ovaard"].includes(data.channel.name?.toLowerCase())) this.notifyDraavo(data);
			else this.notifySenior(data);

			this.client.log(
				"INFO",
				`Incoming POST request on port: \`${this.port}\` - channel: ${data.channel.name}`
			);
		});

		this.server.use("/yt", this.notifier.listener());

		this.subscribe();
		setInterval(() => this.subscribe(), 864e5 * 5);
		return this.server;
	}

	private subscribe() {
		this.notifier.unsubscribe(this.channelIds);
		setTimeout(() => this.notifier.subscribe(this.channelIds), 6e4 / 2);
	}

	public notifySenior(data: iData) {
		this.webhooks.senior.send(
			`<@&751928738672934952>\n**${data.channel.name}** just posted an **EPIC** video! Make sure to check it out below!\n${data.video.link}`
		);
	}

	public notifyDraavo(data: iData) {
		this.webhooks.draavo.send(
			`<@&709908903135019010>\n**${data.channel.name}** just posted an **EPIC** video! Make sure to check it out below!\n${data.video.link}`
		);
	}
}

interface iData {
	channel: {
		name: string;
		id: string;
	};
	video: {
		link: string;
		name: string;
	};
}
