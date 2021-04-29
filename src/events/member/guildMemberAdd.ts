import moment from "moment";
import { GuildMember, MessageEmbed } from "discord.js";
import { Listener } from "discord-akairo";
import Logs from "../../models/logging/Logs";

export default class guildMemberAddListener extends Listener {
	constructor() {
		super("guildMemberAdd", {
			emitter: "client",
			event: "guildMemberAdd",
		});
	}

	async exec(member: GuildMember) {
		const threshold = 1296e5;
		const cache = new Map<string, number>();

		try {
			if (member.partial) member.user = await member.user.fetch();
			if (Date.now() - member.user.createdTimestamp > threshold || !this.client.altdefender)
				return this.log(member, true);

			const roblox = await member.user.robloxUser();
			if (roblox && (roblox.bloxlink || roblox.rover)) return;

			const times = cache.get(member.id) ?? 0;
			if (times > 2) {
				const duration = threshold - (Date.now() - member.user.createdTimestamp);
				const reason =
					"Joining for the third time after 2 kicks because account is created <15 days ago.";

				await Logs.create({
					type: "ban",
					guildId: member.guild.id,
					userId: member.id,
					startDate: Date.now(),
					endDate: Date.now() + duration,
					moderator: this.client.user.id,
					reason,
				});

				await member
					.send(this.client.responses.ban(member.guild.name, reason), { split: true })
					.catch((e) => null);

				await member.ban({ reason });
				return this.log(member, false);
			}

			const reason =
				"Apologies, however your account is too young to be in Draavo's Hangout. Please join back when your account is at least 15 days old. We kick young accounts to prevent alts - Please only use the link below after your account is at least 15 days old. Rejoining after several kicks may result in a temporary ban!";

			await member
				.send(
					`>>> 👞 | **Automatic kick - Draavo's Hangout**\n📃 | Reason: **${reason}**\n\n👋 | **Want to join back?**\n Make sure to connect a roblox account to your discord using bloxlink or Rover to become a valid user! discord.gg/draavo`
				)
				.catch((e) => null);
			await Logs.create({
				type: "kick",
				guildId: member.guild.id,
				userId: member.id,
				startDate: Date.now(),
				moderator: this.client.user.id,
				reason,
			});

			await member.kick("User created <15 days ago, no accounts connected to user.");
			cache.set(member.id, times + 1);

			return this.log(member, false);
		} catch (e) {
			this.client.log("ERROR", `guildMemberAdd error: \`\`\`${e.stack || e.message}\`\`\``);
		}
	}

	async log(member: GuildMember, valid: boolean) {
		if (member.guild.id !== "701781652577321002") return;

		const channel = await this.client.utils.getChannel("764191400451244053");
		await channel.send(
			new MessageEmbed()
				.setColor(valid ? "#5CDBB0" : "#DB5D57")
				.setTitle(`Member joined: ${member.user.tag}`)
				.setDescription([
					`>>> 👤 | **User**: ${member.user.tag} (${member.toString()})`,
					`🗓 | **Created at**: ${moment(member.user.createdTimestamp).format("LT")} ${moment(
						member.user.createdTimestamp
					).format("LL")} | ${moment(member.user.createdTimestamp).fromNow()}`,
					`📊 | **Status**: ${valid ? "valid" : "invalid - kicked"}`,
				])
		);

		if (valid) {
			const general = await this.client.utils.getChannel("701791506226348124");
			await general.send(`**${member.user.tag}** just joined! Make sure to welcome them!`);

			const publicLogs = await this.client.utils.getChannel("701792628844527697");
			await publicLogs.send(
				new MessageEmbed()
					.setColor("#58DCAE")
					.setTitle(`Welcome to Draavo's Hangout, ${member.user.tag}`)
					.setDescription(
						`There are now **${member.guild.memberCount}** members in this server. Don't forget to say hi!`
					)
					.setFooter(
						"The APT has left a message for you: say Hi!",
						"https://cdn.discordapp.com/avatars/418223863047127050/a_d5eeb432a39f983872ab941f4be958f0.gif?size=4096"
					)
			);
		}
	}
}
