import { Message } from "discord.js";
import { Command } from "discord-akairo";
import ms from "ms";
import { TextChannel } from "discord.js";
import { Role } from "discord.js";

export default class automodCommand extends Command {
	constructor() {
		super("automod", {
			aliases: ["automod", "mod"],
			userPermissions: ["MANAGE_GUILD"],
			clientPermissions: ["EMBED_LINKS"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Gathers all automod settings and allows you to modify them",
				usage: "automod [module] [...args]",
			},
			args: [
				{
					id: "module",
					type: (_: Message, str: string) =>
						str
							? ["view", "automod", "mute", "caps", "mention", "spam", "blacklisted"].includes(
									str.toLowerCase()
							  )
								? str.toLowerCase()
								: null
							: null,
					default: "view",
				},
				{
					id: "option",
					type: "lowercase",
				},
				{
					id: "arg1",
					type: "lowercase",
				},
				{
					id: "arg2",
					type: "lowercase",
				},
				{
					id: "arg3",
					type: "lowercase",
					match: "rest",
				},
			],
		});
	}

	async exec(
		message: Message,
		{
			module,
			option,
			arg1,
			arg2,
			arg3,
		}: { module: string; option: string; arg1: string; arg2: string; arg3: string }
	) {
		const command = `${message.prefix}${this.id}`;
		const { automod } = message.guild;
		const muteRole = await this.client.utils.getRole(automod.mutes.role, message.guild);

		switch (module) {
			case "view":
				{
					const arr = [
						`• Automod enabled: ${automod.enabled}`,
						`• Mute Settings:\n- ${[
							`Role: ${muteRole ? `${muteRole.name} (${muteRole.id})` : "no mute role"}`,
							`Triggered every ${automod.mutes.warns} warn(s)`,
							`Default duration: ${ms(automod.mutes.duration, { long: true })}`,
						].join("\n- ")}`,
						`• Caps Settings:\n- ${[
							`Enabled: ${automod.caps.enabled}`,
							`Whitelisted: ${automod.caps.whitelisted.join(", ") || "none"}`,
							`Action: ${automod.caps.action}`,
						].join("\n- ")}`,
						`• Mention Settings:\n- ${[
							`Threshold: \n - ${[
								`Messages: ${automod.mention.threshold.messages}`,
								`Seconds: ${automod.mention.threshold.seconds}s`,
							].join("\n - ")}`,
							`Enabled: ${automod.mention.enabled}`,
							`Whitelisted: ${automod.mention.whitelisted.join(", ") || "none"}`,
							`Action: ${automod.mention.action}`,
						].join("\n- ")}`,
						`• Spam Settings:\n- ${[
							`Threshold: \n - ${[
								`Messages: ${automod.spam.threshold.messages}`,
								`Seconds: ${automod.spam.threshold.seconds}s`,
							].join("\n - ")}`,
							`Enabled: ${automod.spam.enabled}`,
							`Whitelisted: ${automod.spam.whitelisted.join(", ") || "none"}`,
							`Action: ${automod.spam.action}`,
						].join("\n- ")}`,
						`• Blacklisted Settings:\n- ${[
							`Words: \n - ${[
								`Blacklisted: ${automod.blacklisted.words.blacklisted.join(", ") || "none"}`,
								`Whitelisted: ${automod.blacklisted.words.whitelisted.join(", ") || "none"}`,
							].join("\n - ")}`,
							`Whitelisted: ${automod.blacklisted.whitelisted.join(", ") || "none"}`,
							`Action: ${automod.blacklisted.action}`,
						].join("\n- ")}`,
						`• Help Menu:\n${[
							`${command} enabled - Toggles automod for the server`,
							`${command} mute <role/warns/duration> <arg> - Allows you to change the role/warns/duration for the default mute settings`,
							`${command} <caps/mention/spam/blacklisted> whitelisted <channels/users> - Allows you to update the whitelist`,
							`${command} <caps/mention/spam/blacklisted> action <verbal/warn/mute> - Allows you to change the moderation action`,
							`${command} <caps/mention/spam/blacklisted> enabled - Toggles the specified setting for the server`,
							`${command} <mention/spam> threshold <messages/seconds> <arg> - Allows you to update the threshold value`,
							`${command} blacklisted words <blacklisted/whitelisted> <arg> - Allows you to update blacklisted/whitelisted words`,
						].join("\n")}`,
					];
					await message.util.send(arr.join("\n\n"), { code: true, split: true });
				}
				break;
			case "enabled":
				{
					automod.enabled = !automod.enabled;
					await this.client.automod.update(automod);
					await message.util.send(
						`>>> 🤖 | **Automod Updated**:\nAutomod is now **turned ${
							automod.enabled ? "on" : "off"
						}**!`
					);
				}
				break;
			case "mute":
				{
					if (!["role", "warns", "duration"].includes(option))
						return message.util.send(
							`>>> 🤖 | **Automod - Mute**:\nThe option argument must be role/warns/duration.`
						);
					if (!arg1)
						return message.util.send(
							`>>> 🤖 | **Automod - Mute**:\nPlease provide a role/warn count/duration.`
						);

					switch (option) {
						case "role":
							{
								const role = await this.client.utils.getRole(arg1, message.guild);
								if (
									!role ||
									role.managed ||
									role.position >= message.guild.me.roles.highest.position
								)
									return message.util.send(
										">>> 🤖 | **Automod - Mute**:\nI was unable to find/edit this role."
									);

								automod.mutes.role = role.id;
								await this.client.automod.update(automod);
							}
							break;
						case "warns":
							{
								const warns = Number(arg1);
								if (isNaN(warns))
									return message.util.send(
										`>>> 🤖 | **Automod - Mute**:\n"${arg1}" is not a valid number.`
									);
								automod.mutes.warns = warns;

								await this.client.automod.update(automod);
							}
							break;
						case "duration":
							{
								const duration = ms(arg1 || "");
								if (isNaN(duration) || duration === 0)
									return message.util.send(
										">>> 🤖 | **Automod - Mute**:\nInvalid duration provided."
									);
								automod.mutes.duration = duration;

								await this.client.automod.update(automod);
							}
							break;
						default:
							break;
					}

					await message.util.send(
						`>>> 🤖 | **Automod Updated**:\nSuccessfully updated **${option}**!`
					);
				}
				break;
			case "caps":
			case "mention":
			case "spam":
				{
					switch (option) {
						case "whitelisted":
							{
								if (!arg1)
									return message.util.send(
										`>>> 🤖 | **Automod - ${module}**:\nInvalid channel(s)/user(s) provided.`
									);

								const res = (
									await Promise.all(
										[arg1, arg2 || "", ...(arg3 || "").split(/ +/g)]
											.filter((str) => str !== null)
											.map(
												async (str) =>
													(await this.client.utils.getChannel(str)) ||
													(await this.client.utils.getRole(str, message.guild)) ||
													(await this.client.utils.fetchUser(str))
											)
									)
								)
									.filter((v) => v !== null)
									.map((v) =>
										v instanceof TextChannel
											? `CHANNEL-${v.id}`
											: v instanceof Role
											? `ROLE-${v.id}`
											: `USER-${v.id}`
									);

								res.forEach((v) =>
									automod[module].whitelisted.includes(v)
										? (automod[module].whitelisted = automod[module].whitelisted.filter(
												(str) => str !== v
										  ))
										: automod[module].whitelisted.push(v)
								);
								await this.client.automod.update(automod);

								await message.util.send(
									`>>> 🤖 | **Automod Updated**:\nWhitelist for **${module}** successfully updated!`
								);
							}
							break;
						case "action":
							{
								if (!["verbal", "warn", "mute"].includes(arg1))
									return message.util.send(
										`>>> 🤖 | **Automod - ${module}**:\nInvalid action provided, action must be verbal/warn/mute.`
									);

								// @ts-ignore
								automod[module].action = arg1;
								await this.client.automod.update(automod);

								await message.util.send(
									`>>> 🤖 | **Automod Updated**:\nModeration action for **${module}** changed to **${arg1}**!`
								);
							}
							break;
						case "enabled":
							{
								automod[module].enabled = !automod[module].enabled;
								await this.client.automod.update(automod);

								await message.util.send(
									`>>> 🤖 | **Automod Updated**:\n${module} is now **turned ${
										automod[module].enabled ? "on" : "off"
									}**!`
								);
							}
							break;
						case "threshold":
							{
								if (module === "caps")
									return this.exec(message, { module: "view", option, arg1, arg2, arg3 });
								if (!["messages", "seconds"].includes(arg1))
									return message.util.send(
										`>>> 🤖 | **Automod - ${module}**:\nInvalid argument provided, argument must be messages/seconds.`
									);
								if (!arg2 || isNaN(Number(arg2)) || Number(arg2) > 60)
									return message.util.send(
										`>>> 🤖 | **Automod - ${module}**:\nInvalid amount of seconds/messages provided provided.`
									);

								switch (arg1) {
									case "messages":
										{
											automod[module].threshold.messages = Number(arg2);
											await this.client.automod.update(automod);

											await message.util.send(
												`>>> 🤖 | **Automod Updated**:\nThreshold value messages for **${module}** changed to **${arg2} messages**!`
											);
										}
										break;
									case "seconds":
										{
											automod[module].threshold.seconds = Number(arg2);
											await this.client.automod.update(automod);

											await message.util.send(
												`>>> 🤖 | **Automod Updated**:\nThreshold value seconds for **${module}** changed to **${arg2}s**!`
											);
										}
										break;
									default:
										break;
								}
							}
							break;
						default:
							await message.util.send(
								`>>> 🤖 | **Automod**:\nInvalid option name, option name must be: ${[
									"whitelisted",
									"enabled",
									"action",
									"threshold",
								].join(", ")}.`
							);
							break;
					}
				}
				break;
			case "blacklisted":
				{
					switch (option) {
						case "whitelisted":
							{
								if (!arg1)
									return message.util.send(
										`>>> 🤖 | **Automod - ${module}**:\nInvalid channel(s)/user(s) provided.`
									);

								const res = (
									await Promise.all(
										[arg1, arg2 || "", ...(arg3 || "").split(/ +/g)]
											.filter((str) => str !== null)
											.map(
												async (str) =>
													(await this.client.utils.getChannel(str)) ||
													(await this.client.utils.getRole(str, message.guild)) ||
													(await this.client.utils.fetchUser(str))
											)
									)
								)
									.filter((v) => v !== null)
									.map((v) =>
										v instanceof TextChannel
											? `CHANNEL-${v.id}`
											: v instanceof Role
											? `ROLE-${v.id}`
											: `USER-${v.id}`
									);

								res.forEach((v) =>
									automod[module].whitelisted.includes(v)
										? (automod[module].whitelisted = automod[module].whitelisted.filter(
												(str) => str !== v
										  ))
										: automod[module].whitelisted.push(v)
								);
								await this.client.automod.update(automod);

								await message.util.send(
									`>>> 🤖 | **Automod Updated**:\nWhitelist for **${module}** successfully updated!`
								);
							}
							break;
						case "action":
							{
								if (!["verbal", "warn", "mute"].includes(arg1))
									return message.util.send(
										`>>> 🤖 | **Automod - ${module}**:\nInvalid action provided, action must be verbal/warn/mute.`
									);

								// @ts-ignore
								automod[module].action = arg1;
								await this.client.automod.update(automod);

								await message.util.send(
									`>>> 🤖 | **Automod Updated**:\nModeration action for **${module}** changed to **${arg1}**!`
								);
							}
							break;
						case "words":
							{
								if (!["whitelisted", "blacklisted"].includes(arg1))
									return message.util.send(
										`>>> 🤖 | **Automod - ${module}**:\nInvalid argument provided, argument must be whitelisted/blacklisted.`
									);
								if (!arg2)
									return message.util.send(`>>> 🤖 | **Automod - ${module}**:\nNo words provided.`);

								switch (arg1) {
									case "whitelisted":
										{
											const res = [arg1, arg2, ...(arg3 || "").split(/ +/g)].filter(
												(str) => str !== null
											);

											res.forEach((v) =>
												automod[module].words.whitelisted.includes(v)
													? (automod[module].words.whitelisted = automod[
															module
													  ].words.whitelisted.filter((str) => str !== v))
													: automod[module].words.whitelisted.push(v)
											);
											await this.client.automod.update(automod);

											await message.util.send(
												`>>> 🤖 | **Automod Updated**:\nWhitelisted words for **${module}** successfully updated!`
											);
										}
										break;
									case "blacklisted":
										{
											const res = [arg2, ...(arg3 || "").split(/ +/g)].filter(
												(str) => str !== null
											);

											res.forEach((v) =>
												automod[module].words.blacklisted.includes(v)
													? (automod[module].words.blacklisted = automod[
															module
													  ].words.blacklisted.filter((str) => str !== v))
													: automod[module].words.blacklisted.push(v)
											);
											await this.client.automod.update(automod);

											await message.util.send(
												`>>> 🤖 | **Automod Updated**:\nBlacklisted words for **${module}** successfully updated!`
											);
										}
										break;
									default:
										break;
								}
							}
							break;
						default:
							await message.util.send(
								`>>> 🤖 | **Automod**:\nInvalid module name, module name must be: ${[
									"words",
									"whitelisted",
									"action",
								].join(", ")}.`
							);
							break;
					}
				}
				break;
			default:
				break;
		}
	}
}
