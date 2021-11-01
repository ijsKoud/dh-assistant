import type { NextFunction, Request, Response } from "express";
import type Client from "../../../Client";
import Utils from "../utils";

export class AuthMiddleware {
	private readonly cookieName: string = "DH_ASSISTANT-AUTH";
	private utils: Utils;

	public constructor(public client: Client) {
		this.utils = new Utils(client);
	}

	private async run(req: Request, res: Response, next: NextFunction) {
		const authorization = req.cookies[this.cookieName];
		if (authorization) {
			req.auth = this.utils.decrypt(authorization);
			if (!req.auth) res.clearCookie(this.cookieName);

			if (req.auth && req.auth.expires < Date.now()) {
				const data = await this.utils.getToken(req.auth.refresh, true);
				if (data.error) {
					req.auth = null;
					return next();
				}

				const expires = Date.now() + data.expires_in * 1e3;
				const raw = {
					expires,
					refresh: data.refresh_token,
					token: data.access_token,
					userId: req.auth.userId
				};

				req.auth = raw;

				const cookie = this.utils.encrypt(raw);
				res.cookie(this.cookieName, cookie, { maxAge: expires + data.expires_in * 1e3 });
			}
		} else {
			req.auth = null;
		}

		next();
	}

	public get middleware() {
		return this.run.bind(this);
	}
}
