import { config } from "dotenv";
config();

import Client from "./client/Client";
new Client({
	owners: process.env.OWNERS?.split(" ") ?? [],
	intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES", "GUILD_PRESENCES", "GUILD_MEMBERS"],
	debug: !!process.env.DEBUG,
	partials: [],
}).start();
