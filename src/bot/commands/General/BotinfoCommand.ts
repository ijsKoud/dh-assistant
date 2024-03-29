import { Command } from "../../../client/structures/extensions";
import { cpus, platform, totalmem, uptime } from "os";
import { ApplyOptions } from "@sapphire/decorators";
import { version } from "../../../../package.json";
import { memoryUsage } from "process";
import type { Message } from "discord.js";
import ms from "ms";

@ApplyOptions<Command.Options>({
	name: "botinfo",
	description: "Information about this bot",
	requiredClientPermissions: ["EMBED_LINKS"]
})
export default class BotinfoCommand extends Command {
	public async messageRun(message: Message): Promise<void> {
		const core = cpus()[0];
		await message.reply({
			embeds: [
				this.container.client.utils
					.embed()
					.setTitle(`Bot Info: ${this.container.client.user?.tag}`)
					.setDescription(
						[
							"Bot created by [**DaanGamesDG#7621**](https://daangamesdg.xyz)",
							"This bot is open-source, you can find the code [here](https://daangamesdg.xyz/github/dh-assistant)"
						].join("\n")
					)
					.setFields([
						{
							name: "• Bot Information",
							value: `\`\`\`Uptime: ${ms(this.container.client.uptime ?? 0, {
								long: true
							})}\nVersion: v${version}\`\`\``
						},
						{
							name: "• System Information",
							value: `\`\`\`System Platform: ${platform()}\nSystem Uptime: ${ms(uptime() * 1e3, {
								long: true
							})}\`\`\``
						},
						{
							name: "• Cpu Information",
							value: `\`\`\`${[
								core.model,
								cpus()
									.map((data, i) => `${(i + 1).toString().padStart(2, "0")} - ${(data.times.sys / 1e6).toFixed(2)}%`)
									.join("\n")
							].join("\n")}\`\`\``
						},
						{
							name: "• Memory Usage",
							value: `\`\`\`${[
								`Total Memory: ${this.container.client.utils.formatBytes(totalmem())}`,
								`Used Memory: ${this.container.client.utils.formatBytes(memoryUsage().heapUsed)}`
							].join("\n")}\`\`\``
						}
					])
			]
		});
	}
}
