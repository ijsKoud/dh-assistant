import { config } from "dotenv";
config();

import Client from "./client/Client";
new Client({
	owners: process.env.OWNERS?.split(" ") ?? [],
	intents: [
		"GUILDS",
		"GUILD_MESSAGES",
		"DIRECT_MESSAGES",
		"GUILD_PRESENCES",
		"GUILD_MEMBERS",
		"GUILD_BANS",
		"GUILD_MESSAGE_REACTIONS",
	],
	debug: !!process.env.DEBUG,
	partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "USER"],
}).start();
