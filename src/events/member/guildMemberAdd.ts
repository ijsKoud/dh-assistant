import { Listener } from "discord-akairo";
import { GuildMember, MessageEmbed } from "discord.js";
import fetch from "node-fetch";
import moment from "moment";
import { modlog, systemLog, systemLogPublic } from "../../client/config";
import tempban from "../../models/tempban";
import ms from "ms";

const baseURL1 = "https://verify.eryn.io/api/user/";
const baseURL2 = "https://api.blox.link/v1/user/";
const invalidJoins = new Map<string, number>();

export default class guildMemberAdd extends Listener {
	constructor() {
		super("guildMemberAdd", {
			emitter: "client",
			event: "guildMemberAdd",
			category: "client",
		});
	}

	async exec(member: GuildMember): Promise<void> {
		if (member.guild.id !== process.env.GUILD) return;
		const channel = await this.client.utils.getChannel(systemLog);

		const msg = await channel.send(
			`>>> ${this.client.utils.emojiFinder("loading")} | Checking **${
				member.user.tag
			}**, do **not** kick this user.`
		);

		const acc1 = await (await fetch(baseURL1 + member.id)).json();
		const acc2 = await (await fetch(baseURL2 + member.id)).json();
		let kicked: boolean = false;

		if (
			this.client.altDetection &&
			acc1.status === "error" &&
			acc1.errorCode === 404 &&
			acc2.error &&
			acc2.status == "error" &&
			Date.now() - member.user.createdTimestamp < 1296e6 &&
			!member.user.bot &&
			(!member.user.displayAvatarURL().includes(".gif") ||
				!member.user.tag.includes("0001") ||
				!member.user.tag.includes("9999") ||
				!member.user.tag.includes("6666") ||
				!member.user.tag.includes("0003"))
		) {
			const joins = invalidJoins.get(member.id) || invalidJoins.set(member.id, 1).get(member.id);
			if (joins > 2) {
				const reason =
					"Joining for the third time after 2 kicks because account is created <15 days ago.";
				const duration = 1296000000 - (Date.now() - member.user.createdTimestamp);

				await new tempban({
					guildId: member.guild.id,
					moderator: this.client.user.id,
					id: member.id,
					endDate: Date.now() + duration,
					duration,
				})
					.save()
					.catch((e) => {
						console.log(e);
						return null;
					});
				await member.guild.members.ban(member, { reason: `${reason}` }).catch((e) => {
					console.log(e);
				});

				invalidJoins.delete(member.id);
				msg.delete();

				const modLog = await this.client.utils.getChannel(modlog);
				channel.send(
					new MessageEmbed()
						.setAuthor("The ban hammer has come down!")
						.setTitle(`${member.user.tag} has been banned!`)
						.setDescription(`That is one big oof there, don't you think? 🔨`)
						.setFooter(`There are now ${member.guild.memberCount} members in this server.`)
						.setColor("BLACK")
				);
				modLog.send(
					new MessageEmbed()
						.setColor("#FD6CE1")
						.setAuthor(`🔨 tempBan | ${member.user.tag}`)
						.setDescription(
							`Responsable moderator: ${this.client.user.toString()}\nDuration: ${ms(duration)}`
						)
						.addField("• Reason", reason.substr(0, 1024))
				);
			}

			const reason =
				"Apologies, however your account is too young to be in Draavo's Hangout. Please join back when your account is at least 15 days old. We kick young accounts to prevent alts - Please only use the link below after your account is at least 15 days old. Rejoining after several kicks may result in a temporary ban!";

			await member
				.send(
					`> 👞 | **Automatic kick - Draavo's Hangout**\n> 📃 | Reason: **${reason}**\n\n> 👋 | **Want to join back?** \n Make sure to connect a roblox account to your discord using bloxlink or Rover to become a valid user! http://www.draavo.cf/discord`
				)
				.catch((e) => null);

			member
				.kick("User created <15 days ago, no accounts connected to user.")
				.catch((e) => console.log(e));
			kicked = true;
			invalidJoins.set(member.id, joins + 1);
		}

		const creationDate = `${moment(member.user.createdTimestamp).format("LT")} ${moment(
			member.user.createdTimestamp
		).format("LL")} | ${moment(member.user.createdTimestamp).fromNow()}`;
		const bool =
			acc2.status !== "error"
				? this.client.utils.emojiFinder("greentick")
				: this.client.utils.emojiFinder("redtick");

		const embed = new MessageEmbed().setFooter(`ID: ${member.id}`);

		if (!kicked) {
			embed
				.setColor("#58DCAE")
				.setTitle("Member joined: " + member.user.tag)
				.setDescription([
					`> 👤 | **User**: ${member.toString()}`,
					`> 📆 | **Creation date**: ${creationDate}`,
					`> 🎮 | **Connected account**: ${bool}`,
					`> 📊 | **Status**: \`valid\``,
				]);
		} else {
			embed
				.setColor("#DC5E55")
				.setTitle("Member joined & kicked: " + member.user.tag)
				.setDescription([
					`> 👤 | **User**: ${member.toString()}`,
					`> 📆 | **Creation date**: ${creationDate}`,
					`> 🎮 | **Connected account**: ${bool}`,
					`> 📊 | **Status**: \`invalid - kicked\``,
				]);
		}

		msg.edit("", embed);

		if (!member.user.bot) this.welcome(member);
		member.roles.add("701782375834583338");
	}

	async welcome(member: GuildMember) {
		const channel = await this.client.utils.getChannel(systemLogPublic);
		const general = await this.client.utils.getChannel("701791506226348124");

		const embed = new MessageEmbed()
			.setColor("#58DCAE")
			.setTitle(`Welcome to Draavo's Hangout, ${member.user.tag}`)
			.setDescription(
				`There are now **${member.guild.memberCount}** members in this server. Don't forget to say hi!`
			)
			.setFooter(
				"The APT has left a message for you: say Hi!",
				"https://cdn.discordapp.com/avatars/418223863047127050/a_d5eeb432a39f983872ab941f4be958f0.gif?size=4096"
			);

		channel.send(embed);
		general.send(`**${member.user.tag}** just joined! Make sure to welcome them!`);
	}
}
