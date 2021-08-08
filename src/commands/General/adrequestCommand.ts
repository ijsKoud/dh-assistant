import { Message, MessageEmbed } from "discord.js";
import { Command } from "discord-akairo";
import ms from "ms";

export default class adrequestCommand extends Command {
	constructor() {
		super("adrequest", {
			aliases: ["adrequest"],
			channel: "guild",
			description: {
				content: "Ad request",
				usage: "adrequest <ad>",
			},
			args: [
				{
					id: "msg",
					type: "string",
					match: "rest",
				},
			],
		});
	}

	async exec(message: Message, { msg }: { msg: string }) {
		const cooldown = this.client.adcooldown.get(message.author.id);
		if (cooldown) {
			await message.delete().catch();
			return message.util.send(
				`Cooldown is active, please try again in \`${ms(cooldown.cooldown - Date.now())}\`!`
			);
		}

		if (!msg) {
			return message.util.send("Uhm, why didn't you provide a message?");
		}

		if (
			!message.member.hasPermission("USE_EXTERNAL_EMOJIS", { checkAdmin: true, checkOwner: true })
		) {
			await message.delete().catch();
			return message.util.send(
				"Uhm, sorry only users with level 5+ role, boosters, channel members, content creators and staff members are able to do this."
			);
		}
		const channel = await this.client.utils.getChannel("710223624442871970");
		//const channel = await this.client.utils.getChannel("781841366795288576");
		const m = await channel.send(
			new MessageEmbed()
				.setColor(this.client.hex)
				.setDescription(msg)
				.setTitle(`New ad request`.substr(0, 32))
				.addField("User", `**${message.author.tag}** (${message.author.toString()})`)
				.setFooter(`React to deny/approve`)
		);

		[this.client.emoji.greentick, this.client.emoji.redcross].forEach((e) => m.react(e));

		const time =
			message.member?.roles.cache.has("720005552322773053") ||
			message.member?.roles.cache.has("762249312024526849")
				? 36e5
				: 36e5 * 2;
		const timeout = setTimeout(() => this.client.adcooldown.delete(message.author.id), time);

		this.client.adcooldown.set(message.author.id, {
			cooldown: Date.now() + time,
			timeout,
		});

		return message.delete().catch();
	}
}
