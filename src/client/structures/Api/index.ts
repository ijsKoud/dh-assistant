import Notifier, { Notification } from "@daangamesdg/youtube-notifications";
import type { NewsChannel, TextChannel } from "discord.js";
import express, { Express } from "express";
import { readFile } from "fs/promises";
import { join } from "path";
import type Client from "../../Client";
import type { ApiSettings } from "../../types";
import { Logger } from "../extensions";
import cors from "cors";
import { json } from "body-parser";
import cookieParser from "cookie-parser";
import { AuthMiddleware } from "./middleware";
import { ApiRoute, OauthRoute } from "./routes";
import rateLimit from "express-rate-limit";

export default class Api {
	public logger = new Logger({ name: "Api" });

	public apiLimiter = rateLimit({
		windowMs: 1e3,
		max: 10
	});

	public settings!: ApiSettings;

	public server: Express;
	public notifier = new Notifier({
		hubCallback: `${process.env.API}/notifications`,
		middleware: true,
		path: "/notifications"
	});

	private channels!: { draavo: NewsChannel; senior: TextChannel };

	public constructor(public client: Client) {
		this.server = express();
		this.server.use("/notifications", this.notifier.listener());
		this.server.use(
			cors({
				credentials: true,
				origin: ["http://localhost:3000", process.env.DASHBOARD as string]
			}),
			json(),
			cookieParser(),
			new AuthMiddleware(client).middleware,
			this.apiLimiter
		);

		this.server.use("/oauth", new OauthRoute(this.client, this.logger).router);
		this.server.use("/api", new ApiRoute(this.client, this.logger).router);

		void this.loadSettings();

		this.notifier
			.on("notified", this.onNotified.bind(this))
			.on("subscribe", (data) => setTimeout(() => this.notifier.subscribe(data.channel), data.leaseSeconds));
	}

	public notifySenior(data: Notification) {
		void this.channels.senior.send({
			content: `<@&751928738672934952>\n**${data.channel.name}** just posted an **EPIC** video! Make sure to check it out below!\n${data.video.link}`,
			allowedMentions: { roles: ["751928738672934952"] }
		});
	}

	public async notifyDraavo(data: Notification) {
		const msg = await this.channels.draavo.send({
			content: `<@&709908903135019010>\n**${data.channel.name}** just posted an **EPIC** video! Make sure to check it out below!\n${data.video.link}`,
			allowedMentions: { roles: ["709908903135019010"] }
		});

		await msg.crosspost().catch(() => void 0);
	}

	public async loadSettings(): Promise<void> {
		const data = await readFile(join(process.cwd(), "config", "api.json"), "utf-8");

		this.settings = JSON.parse(data);
		this.notifier.secret = this.settings.secret;
	}

	public async start(): Promise<void> {
		this.server.listen(this.settings.port, () => this.logger.info(`The API is listening to port: ${this.settings.port}`));
		if (process.env.NODE_ENV !== "development") this.notifier.subscribe(this.settings.channels);

		this.channels = {
			draavo: (await this.client.utils.getChannel("701788827215462452")) as NewsChannel,
			senior: (await this.client.utils.getChannel("751928419763093635")) as TextChannel
		};
	}

	private onNotified(data: Notification) {
		this.logger.info(`New Notification from ${data.channel.name} (${data.channel.id}): ${data.video.link} (${data.video.title})`);

		if (["draavo", "ovaard"].includes(data.channel.name?.toLowerCase())) void this.notifyDraavo(data);
		else this.notifySenior(data);
	}
}

export * from "./utils";
