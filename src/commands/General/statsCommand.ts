import ms from "ms";
import { Message, MessageEmbed } from "discord.js";
import { Command } from "discord-akairo";
import { version } from "../../../package.json";
import fetch from "node-fetch";
import os from "os";

export default class stats extends Command {
	constructor() {
		super("stats", {
			aliases: ["stats"],
			category: "General",
			description: {
				content: "Some interesting stats.",
				usage: "stats",
			},
		});
	}

	async exec(message: Message) {
		const core = os.cpus()[0];

		message.util.send(
			new MessageEmbed()
				.setColor(message.guild ? message.guild.me.displayHexColor : "BLACK")
				.setTitle(`Bot Stats - ${this.client.user.tag}`)
				.setDescription(
					`This is all the technical information about ${this.client.user.username}. Here you are also able to find the server count, bot uptime & the bot status. The information may not be up to date, it's the most recent information I was able to find in my cache.`
				)
				.addField(
					"• General Information",
					`\`\`\`${[
						`System Platform: ${os.platform()}`,
						`System Uptime: ${ms(os.uptime() * 1000, { long: true })}`,
					].join("\n")}\`\`\``
				)
				.addField(
					"• Cpu Information",
					`\`\`\`${[
						`${core.model}`,
						`Cores: ${os.cpus().length.toString()} | Speed: ${core.speed.toString()}mhz`,
					].join("\n")}\`\`\``
				)
				.addField(
					"• Memory Usage",
					`\`\`\`${[
						`Total Memory: ${this.client.utils.formatBytes(process.memoryUsage().heapTotal)}`,
						`Used Memory: ${this.client.utils.formatBytes(process.memoryUsage().heapUsed)}`,
					].join("\n")}\`\`\``
				)
				.addField(
					"• Bot Information",
					`\`\`\`${[
						`Client Uptime: ${ms(this.client.uptime, { long: true })}`,
						`Client Version: v${version}`,
					].join("\n")}\`\`\``
				)
				.addField(
					"• Github Info",
					"[V1] - Repo: [`github`](https://github.com/DaanGamesDG/draavos-hangout)\n[V2] - Repo: **private**"
				)
		);
	}

	async commits() {
		const json = await (
			await fetch(`https://api.github.com/repos/DaanGamesDG/draavos-hangout/commits`)
		).json();

		let str = "";

		for (const { sha, html_url, commit, author } of json.slice(0, 2)) {
			str += `[\`${sha.slice(0, 7)}\`](${html_url}) ${commit.message
				.substring(0, 80)
				.replace(/\/n/g, "")} - **[@${author.login.toLowerCase()}](${author.html_url})**\n`;
		}

		return str || "No commits found";
	}
}
