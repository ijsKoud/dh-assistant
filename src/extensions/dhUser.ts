import fetch from "node-fetch";
import { Structures } from "discord.js";
import dhClient from "../client/client";

Structures.extend(
	"User",
	(User) =>
		class dhUser extends User {
			public feedbackBlacklisted = false;

			constructor(client: dhClient, data: any) {
				super(client, data);
			}

			public async robloxUser(): Promise<{ rover: string; bloxlink: string }> {
				try {
					const rover =
						(await (
							await fetch("https://verify.eryn.io/api/user/" + this.id, { method: "GET" })
						)?.json()) || {};
					const bloxlink =
						(await (
							await fetch("https://api.blox.link/v1/user/" + this.id, { method: "GET" })
						)?.json()) || {};
					const acc =
						(await (
							await fetch("https://api.roblox.com/users/" + bloxlink?.primaryAccount, {
								method: "GET",
							})
						)?.json()) || {};

					return {
						rover: rover?.robloxUsername,
						bloxlink: acc?.Username,
					};
				} catch (e) {
					(this.client as dhClient).log("ERROR", `robloxUser Fetch error: \`\`\`${e}\`\`\``);
					return { rover: null, bloxlink: null };
				}
			}
		}
);
