import { Structures } from "discord.js";
import modtechClient from "../client/client";
import { iAutomod, iConfig } from "../models/interfaces";

export default Structures.extend(
	"Guild",
	(guild) =>
		class dhGuild extends guild {
			public get config(): iConfig {
				return (this.client as modtechClient).config.get(this.id);
			}

			public get automod(): iAutomod {
				return (this.client as modtechClient).Automod.get(this.id);
			}
		}
);
