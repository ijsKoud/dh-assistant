import { Command } from "discord-akairo";
import { Message } from "discord.js";
import { exec } from "child_process";

export default class updateCommand extends Command {
	constructor() {
		super("update", {
			aliases: ["update"],
			ownerOnly: true,
		});
	}

	async exec(message: Message) {
		const str = (fetched: boolean) =>
			`>>> 🤖 | **Update Command**:\n${
				fetched ? "Successfully fetched the data, compiling..." : "Fetching the data..."
			}`;

		const msg = await message.channel.send(str(false));
		await this.Exec("git pull");

		await msg.edit(str(true));
		await this.Exec("tsc");

		await msg.edit(">>> 🤖 | **Update Command**:\nBot is updated - restarting...");
		this.Exec("pm2 restart 0");
	}

	async Exec(command: string) {
		return new Promise((res, rej) =>
			exec(command, { cwd: process.cwd() }, (e, str) => (e ? rej(e) : res(str)))
		);
	}
}
