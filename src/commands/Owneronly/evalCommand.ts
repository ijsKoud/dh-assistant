import { Command } from "discord-akairo";
import { Message, MessageEmbed, MessageAttachment } from "discord.js";
import { inspect } from "util";

export default class evalCommand extends Command {
	constructor() {
		super("eval", {
			aliases: ["eval", "e", "evaluate"],
			clientPermissions: ["EMBED_LINKS"],
			description: {
				content: "Private command for owners only (only developers know what this does)",
				usage: "eval <code>",
			},
			args: [
				{
					id: "code",
					description: "the code you want to run",
					match: "rest",
				},
			],
			ownerOnly: true,
		});
	}

	async exec(message: Message, { code }: { code: string }) {
		if (!code) return message.react("❌");
		code = code.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

		let evaled: string;
		try {
			const start = process.hrtime();
			evaled = await eval(code);
			const stop = process.hrtime(start);

			const input: string = code;
			const output: string = this.clean(inspect(evaled, { depth: 0 }), this.client.token) as string;
			const timeTaken: number = (stop[0] * 1e9 + stop[1]) / 1e6;

			if (input.length > 1024 || output.length > 1024 || timeTaken.toString().length > 1024) {
				const total = [input, output, timeTaken].join("\n");
				return message.util.send(new MessageAttachment(Buffer.from(total), "evaluated.txt"));
			} else {
				const embed: MessageEmbed = new MessageEmbed()
					.setTitle(`Evaluated code | ${message.author.tag}`)
					.addField("**❯ Input**:", `\`\`\`ts\n${input}\n\`\`\``)
					.addField("**❯ Output**:", `\`\`\`ts\n${output}\n\`\`\``)
					.addField("**❯ Time Taken**:", `\`\`\`${timeTaken}ms \`\`\``)
					.setColor(message.member?.displayHexColor || "BLUE");

				return message.util.send(embed);
			}
		} catch (e) {
			return message.util.send(
				`> ❌ | Error:  \n\`\`\`xl\n${this.clean(e.message, this.client.token)}\n\`\`\``
			);
		}
	}

	clean(text: string, token: string): string | void {
		if (typeof text === "string") {
			return text
				.replace(/`/g, `\`${String.fromCharCode(8203)}`)
				.replace(/@/g, `@${String.fromCharCode(8203)}`)
				.replace(new RegExp(token, "gi"), `****`);
		}
	}
}
