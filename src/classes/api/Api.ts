import { join } from "path";
import dhClient from "../../client/client";
import express, { Request, Response } from "express";
import { readFile } from "fs/promises";

export default class Api {
	public servers = {
		tickets: express(),
		notifications: express(),
	};

	constructor(public client: dhClient) {
		this.servers.tickets
			.get("/:id", async (req, res) => await this.handleTickets(req, res))
			.get("*", (_, res) => res.redirect("https://daangamesdg.wtf/"));

		this.servers.notifications.get("/", (_, res) =>
			res.status(200).send("Notifications api online")
		);
	}

	public start() {
		this.servers.tickets.listen(80, () =>
			this.client.log("INFO", `Ticket api is listening to port \`80\``)
		);
		this.servers.notifications.listen(3000, () =>
			this.client.log("INFO", `Notifications api is listening to port \`3000\``)
		);
	}

	private async handleTickets(req: Request, res: Response) {
		const { id } = req.params;
		const dir = join(process.cwd(), "transcripts", `${id}.html`);
		const file: Buffer = await readFile(dir).catch((e) => null);

		if (!file) return res.redirect("/");
		return res.sendFile(dir);
	}
}
