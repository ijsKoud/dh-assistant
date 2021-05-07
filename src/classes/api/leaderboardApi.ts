import dhClient from "../../client/client";
import { Router, Request, Response, NextFunction } from "express";

export default class leaderboardApi {
	public router = Router();

	constructor(private client: dhClient) {
		this.router
			.get("/logo", (req, res) =>
				res.send(client.guilds.cache.get(process.env.GUILD)?.iconURL({ dynamic: true, size: 4096 }))
			)
			.get("/stats", this.authenicated, (req, res) => this.getStats(req, res));
	}

	public authenicated(req: Request, res: Response, next: NextFunction) {
		if (!req.headers?.authorization || req.headers?.authorization !== process.env.AUTH_KEY)
			return res.status(401).json({ status: 401, message: "Unauthorized" });

		next();
	}

	public async getStats(req: Request, res: Response) {
		const levels = await this.client.levelManager.getLevels(process.env.GUILD);
		if (!levels) return res.status(400).send({ status: 400, message: "no level stats found " });

		return res.status(200).json({ status: 200, levels });
	}
}
