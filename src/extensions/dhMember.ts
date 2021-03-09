import fetch from "node-fetch";
import { Guild, Structures } from "discord.js";
import dhClient from "../client/client";

Structures.extend(
	"GuildMember",
	(GuildMember) =>
		class dhGuildMember extends GuildMember {
			pending = false;

			constructor(client: dhClient, data: any, guild: Guild) {
				super(client, data, guild);
				this.pending = data.pending ?? false;
			}

			_patch(data: any) {
				// @ts-expect-error
				super._patch(data);
				this.pending = data.pending ?? false;
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
