import { config } from "dotenv";
import { mkdir, readdir } from "fs/promises";
import { join } from "path";
config();

import Client from "./client/Client";

void (async () => {
	const dirs = await readdir(process.cwd());
	if (!dirs.includes("data")) await mkdir(join(process.cwd(), "data"));
	if (!dirs.includes("transcripts")) await mkdir(join(process.cwd(), "transcripts"));

	void new Client({
		owners: process.env.OWNERS?.split(" ") ?? [],
		intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES", "GUILD_PRESENCES", "GUILD_MEMBERS", "GUILD_BANS", "GUILD_MESSAGE_REACTIONS"],
		debug: Boolean(process.env.DEBUG),
		partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "USER"]
	}).start();
})();
