import { Message } from "discord.js";
import { Command } from "discord-akairo";
import fetch from "node-fetch";
import Config from "../../models/guild/Config";

export default class loggingCommand extends Command {
	constructor() {
		super("logging", {
			aliases: ["logging"],
			userPermissions: ["MANAGE_GUILD"],
			clientPermissions: ["MANAGE_WEBHOOKS", "MANAGE_CHANNELS"],
			cooldown: 2e3,
			description: {
				content: "Gathers all automod settings and allows you to modify them.",
				usage: "logging [option] [channel]",
			},
			args: [
				{
					id: "option",
					type: (_: Message, str: string) =>
						str
							? ["message", "mod"].includes(str.toLowerCase())
								? str.toLowerCase()
								: null
							: null,
				},
				{
					id: "id",
					type: "string",
				},
			],
		});
	}

	async exec(message: Message, { option, id }: { option: string; id: string }) {
		let { messageLogging, modLogging } = message.guild.config;

		switch (option) {
			case "message":
				{
					const channel = await this.client.utils.getChannel(id);
					if (channel) {
						if (
							channel.type !== "text" ||
							!channel.permissionsFor(this.client.user).has(["MANAGE_WEBHOOKS", "MANAGE_CHANNELS"])
						)
							return message.util.send(
								this.client.responses.missingArg(
									"Invalid channel provided/missing the permissions `Manage Webhooks` & `Manage Channels`"
								)
							);

						const webhook = await channel.createWebhook(
							`${this.client.user.username} - Message Logging`,
							{
								avatar: this.client.user.avatarURL({ dynamic: true, size: 4096 }),
								reason: `Webhook created for message logging`,
							}
						);

						messageLogging = webhook.url;
					} else messageLogging = "null";

					await Config.findOneAndUpdate({ guildId: message.guild.id }, { messageLogging });
					this.client.config.set(message.guild.id, { ...message.guild.config, messageLogging });
					await message.util.send(
						">>> 🗃 | **Logging**:\nSuccesfully updated the message logging channel!"
					);
				}
				break;
			case "mod":
				{
					{
						const channel = await this.client.utils.getChannel(id);
						if (channel) {
							if (
								channel.type !== "text" ||
								!channel
									.permissionsFor(this.client.user)
									.has(["MANAGE_WEBHOOKS", "MANAGE_CHANNELS"])
							)
								return message.util.send(
									this.client.responses.missingArg(
										"Invalid channel provided/missing the permissions `Manage Webhooks` & `Manage Channels`"
									)
								);

							const webhook = await channel.createWebhook(
								`${this.client.user.username} - Mod Logging`,
								{
									avatar: this.client.user.avatarURL({ dynamic: true, size: 4096 }),
									reason: `Webhook created for mod logging`,
								}
							);

							modLogging = webhook.url;
						} else modLogging = "null";

						await Config.findOneAndUpdate({ guildId: message.guild.id }, { modLogging });
						this.client.config.set(message.guild.id, { ...message.guild.config, modLogging });
						await message.util.send(
							">>> 🗃 | **Logging**:\nSuccesfully updated the mod logging channel!"
						);
					}
				}
				break;
			default:
				{
					const [messageChannel, modChannel] = (
						await Promise.all(
							[messageLogging, modLogging].map(async (str) =>
								str === "string" && str.startsWith("http")
									? (await fetch(str, { method: "GET" })).json().catch((e) => null)
									: null
							)
						)
					).map((d) => d?.channel_id);
					await message.util.send(
						`>>> 🗃 | **logging**:\nMessage Logs: ${
							messageChannel ? `<#${messageChannel}>` : "None"
						}\nMod Logs: ${modChannel ? `<#${modChannel}>` : "None"}`
					);
				}
				break;
		}
	}
}
