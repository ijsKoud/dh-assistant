import { Message } from "discord.js";
import { Listener } from "discord-akairo";

const types = {
	spam: "spam",
	blacklisted: "use blacklisted words",
	mention: "mass mention users",
};

export default class messageEvent extends Listener {
	constructor() {
		super("message", {
			emitter: "client",
			event: "message",
		});
	}

	async exec(message: Message) {
		if (!message.guild || message.author.bot || message.system) return;

		if (
			!message.content.startsWith(this.client.commandHandler.prefix as string) &&
			!this.client.config.lvlBlacklisted.includes(message.channel.id) &&
			message.channel.type !== "dm"
		) {
			const data =
				(await this.client.levelManager.getUser(message.author.id, message.guild.id)) ||
				(await this.client.levelManager.createUser(message.author.id, message.guild.id));
			const lvl = await this.client.levelManager.updateUser(message.author.id, message.guild.id, {
				xp: this.client.levelManager.generateXP(data.xp),
			});

			if (lvl?.lvlUp) {
				await this.client.levelManager.rankUser(message.member, {
					...lvl.lvl,
					level: lvl.lvl.level + 1,
				});
				await message.channel.send(
					`Congratulations ${message.author.toString()}, you have got level **${
						lvl.lvl.level + 1
					}**!`
				);
			}
		}

		if (
			message.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true }) ||
			this.client.isOwner(message.author.id)
		)
			return;

		const automod = this.client.automod.check(message);
		automod.forEach(async (w) => {
			if (w.type === "capabuse")
				return message.channel
					.send(`Hey ${message.author.toString()}, **${w.reason}**`)
					.then((m) => m.delete({ timeout: 5e3 }));

			try {
				const caseId = await this.client.automod.warn(message.member, message.guild.me, w.reason);
				await message.member
					.send(
						this.client.tagscript(
							this.client.messages.DM +
								"\n\n❗ | This warning is registered under the id `{CASE_ID}`",
							{
								TYPE: "warning",
								GUILD: message.guild.name,
								CASE_ID: caseId,
								reason: w.reason.substr(0, 1900),
							}
						)
					)
					.catch((e) => null);

				message.channel
					.send(
						`Hey ${message.author.toString()}, you aren't allowed to **${types[w.type]}** here!`
					)
					.then((m) => m.delete({ timeout: 5e3 }))
					.catch((e) => null);
				message.delete().catch((e) => null);
			} catch (e) {
				this.client.log("ERROR", `Automod error: \`\`\`${e}\`\`\``);
			}
		});
	}
}
