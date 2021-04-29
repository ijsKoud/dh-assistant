import { Message } from "discord.js";
import { Command } from "discord-akairo";

export default class ticketsCommand extends Command {
	constructor() {
		super("tickets", {
			aliases: ["tickets", "ticketsconfig"],
			userPermissions: ["MANAGE_GUILD"],
			clientPermissions: ["USE_EXTERNAL_EMOJIS"],
			cooldown: 1e3,
			description: {
				content: "Gathers all tickets settings and allows you to modify them.",
				usage: "ticket [module] [...args]",
			},
			args: [
				{
					id: "module",
					type: (_: Message, str: string) =>
						str
							? ["view", "enabled", "channel", "category", "role", "transcript"].includes(
									str.toLowerCase()
							  )
								? str.toLowerCase()
								: null
							: null,
					default: "view",
				},
				{
					id: "arg1",
					type: "string",
				},
				{
					id: "arg2",
					type: "string",
				},
			],
		});
	}

	async exec(
		message: Message,
		{ module, arg1, arg2 }: { module: string; arg1: string; arg2: string }
	) {
		const command = `${message.prefix}${this.id}`;
		const config = await this.client.ticketHandler.getConfig(message.guild.id);
		const accessRole = await this.client.utils.getRole(config.roleId, message.guild);
		const channel = await this.client.utils.getChannel(config.channelId);
		const transcriptChannel = await this.client.utils.getChannel(config.transcripts.channelId);
		const category = await this.client.utils.getChannel(config.category);

		switch (module) {
			case "view":
				{
					const arr = [
						`• Tickets enabled: ${config.enabled}`,
						`• General Settings:\n- ${[
							`Accessrole: ${
								accessRole ? `${accessRole.name} (${accessRole.id})` : "no access role"
							}`,
							`Channel: ${channel ? `${channel.name} (${channel.id})` : "no claim channel"}`,
							`Category: ${category ? `${category.name} (${category.id})` : "no category chanel"}`,
						].join("\n- ")}`,
						`• Transcript Settings:\n- ${[
							`Enabled: ${config.transcripts.enabled}`,
							`Channel: ${
								transcriptChannel
									? `${transcriptChannel.name} (${transcriptChannel.id})`
									: "no transcript channel"
							}`,
						].join("\n- ")}`,
						`• Help Menu:\n${[
							`${command} enabled - Toggles tickets for the server`,
							`${command} channel <channel> - Allows you to change the claim channel`,
							`${command} category <channel> - Allows you to change the category channel`,
							`${command} role <role> - Allows you to change the access role`,
							`${command} transcript enabled - Toggles transcripts for the server`,
							`${command} transcript channel <channel> - Allows you to change the transcript channel`,
						].join("\n")}`,
					];
					await message.util.send(arr.join("\n\n"), { code: true, split: true });
				}
				break;
			case "enabled":
				{
					config.enabled = !config.enabled;
					await message.util.send(
						`>>> 🎫 | **Tickets Updated**:\nTickets is now **turned ${
							config.enabled ? "on" : "off"
						}**!`
					);
				}
				break;
			case "channel":
				{
					const c = await this.client.utils.getChannel(arg1);
					if (
						!c ||
						c.type !== "text" ||
						!c
							.permissionsFor(this.client.user)
							.has(["SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS"])
					)
						return message.util.send(
							`>>> 🎫 | **Tickets - Channel**:\nInvalid channel provided/missing required permissions (\`Send Messages\`, \`Embed Links\`, \`Add Reaction\`)`
						);

					config.channelId = c.id;
					await message.util.send(
						`>>> 🎫 | **Tickets Updated**:\nClaim channel successfully changed to **${
							c.name
						}** (${c.toString()})`
					);
				}
				break;
			case "category":
				{
					const c = await this.client.utils.getChannel(arg1);
					// @ts-expect-error
					if (!c || c.type !== "category")
						return message.util.send(`>>> 🎫 | **Tickets - Channel**:\nInvalid category provided`);

					config.category = c.id;
					await message.util.send(
						`>>> 🎫 | **Tickets Updated**:\nCategory channel successfully changed to **${
							c.name
						}** (${c.toString()})`
					);
				}
				break;
			case "role":
				{
					const role = await this.client.utils.getRole(arg1, message.guild);
					if (!role || role.managed || role.position >= message.guild.me.roles.highest.position)
						return message.util.send(
							`>>> 🎫 | **Tickets - Role**:\nInvalid role provided/unable to manage it.`
						);

					config.roleId = role.id;
					await message.util.send(
						`>>> 🎫 | **Tickets Updated**:\nAccess role successfully changed to **${
							role.name
						}** (${role.toString()})`,
						{ allowedMentions: { roles: [] } }
					);
				}
				break;
			case "transcript":
				{
					switch (arg1) {
						case "channel":
							{
								const c = await this.client.utils.getChannel(arg2);
								if (
									!c ||
									c.type !== "text" ||
									!c.permissionsFor(this.client.user).has(["SEND_MESSAGES", "ATTACH_FILES"])
								)
									return message.util.send(
										`>>> 🎫 | **Tickets - Transcript**:\nInvalid channel provided/missing required permissions (\`Send Messages\`, \`Attach Files\`)`
									);

								config.transcripts.channelId = c.id;
								await message.util.send(
									`>>> 🎫 | **Tickets Updated**:\nTranscripts channel successfully changed to **${
										c.name
									}** (${c.toString()})`
								);
							}
							break;
						case "enabled":
							{
								config.transcripts.enabled = !config.transcripts.enabled;
								await message.util.send(
									`>>> 🎫 | **Tickets Updated**:\nTicket transcripts are now **turned ${
										config.transcripts.enabled ? "on" : "off"
									}**!`
								);
							}
							break;
						default:
							return message.util.send(
								'>>> 🎫 | **Tickets - Transcript**:\nInvalid module name, module name must be "channel" or "enabled"'
							);
					}
				}
				break;
			default:
				break;
		}

		await this.client.ticketHandler.updateConfig(config);
	}
}
