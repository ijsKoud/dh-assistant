import { Command } from "discord-akairo";
import { Message } from "discord.js";
import Ticket from "../../model/tickets/Ticket";

export default class transferCommand extends Command {
	public constructor() {
		super("transfer", {
			aliases: ["transfer"],
			channel: "guild",
			description: {
				content: "Transfer a ticket to a different user.",
				usage: "transfer <user>",
			},
			args: [
				{
					id: "userId",
					type: "string",
					prompt: {
						start: "To who do you want to transfer this ticket?",
						retry: "To who do you want to transfer this ticket?",
					},
				},
			],
		});
	}

	async exec(message: Message, { userId }: { userId: string }) {
		if (message.channel.type !== "text") return;
		if (message.channel.name !== "ticket") return;

		const config = await Ticket.findOne({ channelId: message.channel.id });
		const user = await this.client.utils.fetchUser(userId);

		if (!user) return message.util.send(`>>> 🔎 | I was unable to find a user called "${userId}"!`);

		if (
			!config ||
			(config.claimerId !== message.author.id &&
				!message.member.hasPermission("MANAGE_CHANNELS", { checkAdmin: true, checkOwner: true }))
		)
			return;

		// if (user.presence.status === "offline")
		// 	return message.util.send(
		// 		`>>> ❗ | This user is **ofline**, you can only transfer to users who are online.`
		// 	);
		if (user.bot || user.system)
			return message.util.send(
				`>>> ❗ | This user is a **bot**, you can only transfer to users who aren't discord bots.`
			);
		if (user.id === message.author.id)
			return message.util.send(`>>> 🤔 | Why are you trying to transfer it to yourself?!`);

		const ticketOwner = await this.client.utils.fetchUser(config.userId);
		try {
			await ticketOwner.send(`>>> 📨 | Your ticket has been transferred to **${user.tag}**.`);
		} catch (e) {
			message.util.send(">>> ❗ | I am unable to send messages to this user.");
		}

		try {
			await message.channel.updateOverwrite(message.author, {
				VIEW_CHANNEL: false,
			});
			await message.channel.updateOverwrite(user, {
				VIEW_CHANNEL: true,
				ATTACH_FILES: true,
				SEND_MESSAGES: true,
			});

			config.claimerId = user.id;
			await config.save();
		} catch (e) {
			message.util.send(">>> ❗ | Oops, an unexpected error happened, please try again later.");
			this.client.log("ERROR", `Unkown error from transfer command: \`\`\`${e}\`\`\``);
		}

		message.util.send(
			`>>> 👋 | Welcome ${user.toString()}, please check the pins for more information!`
		);
	}
}
