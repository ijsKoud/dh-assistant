import type { Logger } from "@daangamesdg/logger";
import { NextFunction, Request, Response, Router } from "express";
import type Client from "../../../Client";
import type { ApiResponse, User } from "../../../types";
import Utils from "../utils";

export class ApiRoute {
	public router: Router;
	public utils: Utils;

	public constructor(public client: Client, public logger: Logger) {
		this.utils = new Utils(client);
		this.router = Router();
		this.router.get("/user", this.user.bind(this)); // get user
	}

	// private async modCheck(req: Request, res: Response, next: NextFunction) {
	// 	if (!req.auth) return res.send(null);

	// 	try {
	// 		const guild = this.client.guilds.cache.get(this.client.constants.guild);
	// 		if (!guild) throw new Error("Unable to get the correct guild");

	// 		const member = await this.client.utils.fetchMember(req.auth.userId, guild);
	// 		if (!member || (!this.client.permissionHandler.hasMod(member) && !this.client.isOwner(member.id))) return res.send(null);

	// 		next();
	// 	} catch (e) {
	// 		res.status(500).json({ message: "internal server error", error: (e as any).message });
	// 	}
	// }

	// private async adminCheck(req: Request, res: Response, next: NextFunction) {
	// 	if (!req.auth) return res.send(null);

	// 	try {
	// 		const guild = this.client.guilds.cache.get(this.client.constants.guild);
	// 		if (!guild) throw new Error("Unable to get the correct guild");

	// 		const member = await this.client.utils.fetchMember(req.auth.userId, guild);
	// 		if (!member || (!this.client.permissionHandler.hasSenior(member) && !this.client.isOwner(member.id))) return res.send(null);

	// 		next();
	// 	} catch (e) {
	// 		res.status(500).json({ message: "internal server error", error: (e as any).message });
	// 	}
	// }

	private async user(req: Request, res: Response<User | ApiResponse>) {
		if (!req.auth) {
			res.send(null);
			return;
		}

		try {
			const user: User = this.client.ApiCache.get(`${req.auth.userId}-user`) || (await this.utils.getUser(req.auth.userId));
			if (!user) throw new Error("unable to get user");

			const guild = this.client.guilds.cache.get(this.client.constants.guild);
			if (!guild) {
				res.send(user);
				return;
			}

			const member = await this.client.utils.fetchMember(req.auth.userId, guild);
			if (!member) {
				res.send(user);
				return;
			}

			res.send({ ...user, rank: this.client.permissionHandler.getRank(member) });
		} catch (e) {
			res.status(500).json({ message: "internal server error", error: (e as any).message });
		}
	}
}
