import { Guild, Structures } from "discord.js";
import dhClient from "../client/client";

Structures.extend(
	"GuildMember",
	(GuildMember) =>
		class dhGuildMember extends GuildMember {
			public pending = false;
			public multiplier: number = 1;

			constructor(client: dhClient, data: any, guild: Guild) {
				super(client, data, guild);
				this.pending = data.pending ?? false;
			}

			_patch(data: any) {
				// @ts-expect-error
				super._patch(data);
				this.pending = data.pending ?? false;
			}
		}
);
