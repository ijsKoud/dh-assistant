import type { Logger } from "@daangamesdg/logger";
import { Request, Response, Router } from "express";
import type Client from "../../../Client";
import Utils from "../utils";

export class OauthRoute {
	public router: Router;
	public utils: Utils;

	public constructor(public client: Client, public logger: Logger) {
		this.utils = new Utils(client);
		this.router = Router();
		this.router.get("/callback", this.callback.bind(this)).get("/login", this.login.bind(this)).delete("/logout", this.logout.bind(this));
	}

	private async callback(req: Request, res: Response): Promise<void> {
		const code = this.utils.parseQuery(req.query.code);
		if (!code) {
			res.status(400).send("bad request");
			return;
		}

		try {
			const data = await this.utils.getToken(code);
			if (data.error) throw new Error(data.error);

			const user = await this.utils.getTokenUser(data.access_token, "");
			if (!user) throw new Error("unable to get user");

			const expires = Date.now() + data.expires_in * 1e3;
			const cookie = this.utils.encrypt({
				expires,
				refresh: data.refresh_token,
				token: data.access_token,
				userId: user.id
			});

			res.cookie("DH_ASSISTANT-AUTH", cookie, {
				maxAge: expires + data.expires_in * 1e3
			}).redirect(process.env.DASHBOARD ?? "http://localhost:3000");
		} catch (err) {
			res.status(500).json({ message: "internal server error", error: err.message });
		}
	}

	private login(_: Request, res: Response) {
		res.redirect(
			`https://discord.com/api/v9/oauth2/authorize?client_id=${this.client.user?.id}&redirect_uri=${encodeURIComponent(
				process.env.DISCORD_URI as string
			)}&response_type=code&scope=identify`
		);
	}

	private async logout(req: Request, res: Response) {
		if (!req.auth) {
			res.status(401).send("Unauthorized");
			return;
		}

		try {
			const data = await this.utils.revokeToken(req.auth.token);
			if (!data) throw new Error("unknown error");
			if (data.status === 503) {
				const retryAfter = data.headers["Retry-After"];
				const duration = retryAfter === null ? 5e3 : Number(retryAfter) * 1e3;
				await new Promise((resolve) => setTimeout(resolve, duration));

				await this.logout(req, res);
				return;
			}

			res.clearCookie("DH_ASSISTANT-AUTH").sendStatus(204);
		} catch (err) {
			this.logger.fatal(`OauthRoute#logout: ${err.message}`);
			res.status(500).json({ message: "internal server error", error: err.message });
		}
	}
}
