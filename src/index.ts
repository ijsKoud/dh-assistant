import { config } from "dotenv";
config();

import Client from "./client/Client";
new Client({
	owners: process.env.OWNERS?.split(" ") ?? [],
	intents: ["GUILDS", "GUILD_MESSAGES"],
	debug: !!process.env.DEBUG,
	partials: [],
	activity: [
		{
			type: "LISTENING",
			name: "DaanGamesDG",
		},
	],
}).start();
