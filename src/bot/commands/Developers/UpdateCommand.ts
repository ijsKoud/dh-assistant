import { Command } from "../../../client/structures/Command";
import { ApplyOptions } from "@sapphire/decorators";
import { Args } from "@sapphire/framework";
import { Message } from "discord.js";
import { exec } from "child_process";

@ApplyOptions<Command.Options>({
	name: "update",
	aliases: ["update"],
	description: "Fetches and compiles the code from GitHub, restarts to finish the update",
	usage: "[--no-restart|--update-deps|--no-fetch]",
	flags: ["no-restart", "update-deps", "no-fetch"],
	preconditions: ["OwnerOnly"],
})
export default class UpdateCommand extends Command {
	public async run(message: Message, args: Args): Promise<void> {
		this.container.client.loggers
			.get("bot")
			?.info(`Executing update - requested by ${message.author.tag}`);

		const fetch = !args.getFlags("no-fetch");
		const restart = !args.getFlags("no-restart");
		const update = args.getFlags("update-deps");

		const msg = await message.reply(">>> 🤖 | Update Command**");
		if (fetch) {
			await msg.edit(">>> 🤖 | Update Command**\nFetching code from GitHub");
			await this.Exec("git pull");
		}

		if (update) {
			await msg.edit(">>> 🤖 | Update Command**\nInstalling new Dependencies");
			await this.Exec("yarn install");
		}

		await this.Exec("npm build");

		if (restart) {
			await msg.edit(">>> 🤖 | Update Command**\nBot is updated - restarting...");
			return process.exit(0);
		}

		await msg.edit(">>> 🤖 | **Update Command**:\nUpdate completed, no restart executed!");
	}

	async Exec(command: string) {
		return new Promise((res, rej) =>
			exec(command, { cwd: process.cwd() }, (e, str) => (e ? rej(e) : res(str)))
		);
	}
}
