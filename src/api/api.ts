// setup notifier
import YouTubeNotifier from "youtube-notification";
import { WebhookClient } from "discord.js";
import { channelIds, DraavoMsg, seniorTeamMsg } from "../client/config";
import express from "express";
import dhClient from "../client/client";

const webhook = new WebhookClient(process.env.YTID, process.env.YTTOKEN);
const webhookS = new WebhookClient(process.env.YTIDS, process.env.YTTOKENS);
const links: string[] = [];

export default class notifications {
	constructor(private client: dhClient) {}

	start() {
		const notifier = new YouTubeNotifier({
			hubCallback: "http://85.214.166.129:3000/yt",
			secret: "very_cool_secret",
		});

		notifier.on("notified", (data: any) => {
			if (links.includes(data.video.link)) return;
			links.push(data.video.link);

			data.channel.id === "UCkMrp3dJhWz2FcGTzywQGWg"
				? send(
						DraavoMsg.replace(/{channelName}/g, data.channel.name).replace(
							/{link}/g,
							data.video.link
						),
						data.channel.id
				  )
				: send(
						seniorTeamMsg
							.replace(/{channelName}/g, data.channel.name)
							.replace(/{link}/g, data.video.link),
						data.channel.id
				  );
		});

		notifier.unsubscribe(channelIds);

		// setup web server for callback
		const app = express();

		app.use("/yt", notifier.listener());
		app.get("/", (req, res) => res.sendStatus(200));

		app.listen(process.env.PORT, () =>
			this.client.log(`🚪 | API Listening to port **${process.env.PORT}**!`)
		);

		setTimeout(() => notifier.subscribe(channelIds), 6e4 / 2);

		function send(message: string, id: string) {
			id === "UCkMrp3dJhWz2FcGTzywQGWg"
				? webhook.send(message).catch((e) => console.log(e))
				: webhookS.send(message).catch((e) => console.log(e));
		}
	}
}
