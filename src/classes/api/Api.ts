import { join } from "path";
import dhClient from "../../client/client";
import express, { Request, Response } from "express";
import { readFile } from "fs/promises";
import cors from "cors";

import NotificationsApi from "./NotificationsApi";
import leaderboardApi from "./leaderboardApi";

export default class Api {
	public servers = {
		tickets: express(),
		notifications: new NotificationsApi(this.client),
		leaderboardApi: new leaderboardApi(this.client),
	};

	constructor(public client: dhClient) {
		this.servers.tickets
			.use(
				cors({
					origin: [
						"http://localhost:3000",
						"http://localhost:3001",
						"https://leaderboards.daangamesdg.tk",
					],
					credentials: true,
				})
			)
			.use("/api", this.servers.leaderboardApi.router)
			.get("/:id", async (req, res) => await this.handleTickets(req, res))
			.get("*", (_, res) => res.redirect("https://daangamesdg.wtf/"));
	}

	public start() {
		this.servers.tickets.listen(80, () =>
			this.client.log("INFO", `Ticket api is listening to port \`80\``)
		);

		this.servers.notifications.server.listen(3000, () =>
			this.client.log("INFO", `Notifications api is listening to port \`3000\``)
		);
		this.servers.notifications.loadAll();
	}

	private async handleTickets(req: Request, res: Response) {
		const { id } = req.params;
		const dir = join(process.cwd(), "transcripts", `${id}.html`);
		const file: Buffer = await readFile(dir).catch((e) => null);

		if (!file) return res.redirect("/");
		return res.sendFile(dir);
	}
}
