import { Command } from "discord-akairo";
import { Message, MessageAttachment, TextChannel } from "discord.js";
import Ticket from "../../model/tickets/Ticket";
import { join } from "path";
import { exec } from "child_process";
import { unlink } from "fs/promises";
import { MessageEmbed } from "discord.js";

export default class closeCommand extends Command {
	public constructor() {
		super("close", {
			aliases: ["close"],
			channel: "guild",
			description: {
				content: "Closes a ticket and transcripts the channel if enabled",
				usage: "close",
			},
		});
	}

	async exec(message: Message) {
		if (message.channel.type !== "text") return;
		if (message.channel.name !== "ticket") return;

		const config = await Ticket.findOne({ channelId: message.channel.id });
		if (!config) return;

		const user = await this.client.utils.fetchUser(config.userId);

		if (
			!config ||
			(config.claimerId !== message.author.id &&
				!message.member.hasPermission("MANAGE_CHANNELS", { checkAdmin: true, checkOwner: true }))
		)
			return;

		const channel = await this.client.utils.getChannel(this.client.config.tickets.transcript);
		if (channel) {
			message.channel.startTyping();
			exec(
				`${
					process.platform === "win32"
						? "DiscordChatExporter.Cli.exe"
						: "dotnet DiscordChatExporter.Cli.dll"
				} export -c ${message.channel.id} -t ${this.client.token} -o ${join(
					__dirname,
					"..",
					"..",
					"..",
					"transcripts"
				)} -b`,
				{
					cwd: join(process.cwd(), "chatExporter"),
				},
				async (e, stdout) => {
					if (e) return this.client.log("ERROR", `Transcript error: \`\`\`${e}\`\`\``);

					const dir = join(
						__dirname,
						"..",
						"..",
						"..",
						"transcripts",
						`${message.guild.name} - ${(message.channel as TextChannel).parent?.name || "text"} - ${
							(message.channel as TextChannel).name
						} [${message.channel.id}].html`
					);

					await channel
						.send(
							new MessageEmbed()
								.setTitle(`transcript - ${user.tag}`)
								.setDescription(`Ticket claimer: <@${config.claimerId}>`)
								.setColor(this.client.hex)
						)
						.catch((e) => null);
					channel
						.send(new MessageAttachment(dir, `${message.channel.id}-ticket.html`))
						.catch((e) => null);

					await user
						.send(">>> 📪 | Your ticket has been closed, thanks for getting in touch.")
						.catch((e) => null);

					config.status = "closed";
					await config.save();
					message.channel.stopTyping();

					setTimeout(async () => {
						await config.deleteOne();
						message.channel.delete("deleted by user");
						unlink(dir);
					}, 5e3);
					message.channel.send(">>> 🗑 | Deleting this ticket in **5 seconds**!");
				}
			);
		} else {
			config.status = "closed";
			await config.save();
			message.channel.stopTyping();

			await user
				.send(">>> 📪 | Your ticket has been closed, thanks for getting in touch.")
				.catch((e) => null);

			setTimeout(async () => {
				await config.deleteOne();
				message.channel.delete("deleted by user");
			}, 5e3);
			message.channel.send(">>> 🗑 | Deleting this ticket in **5 seconds**!");
		}
	}
}
