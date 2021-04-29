import { Message } from "discord.js";
import { Command } from "discord-akairo";

const ball: string[] = [
	"🎱 | As I see it, yes,",
	"🎱 | Better not tell you now,",
	"🎱 | Cannot predict now,",
	"🎱 | Concentrate and ask again,",
	"🎱 | Don’t count on it,",
	"🎱 | It is certain,",
	"🎱 | It is decidedly so,",
	"🎱 | Most likely,",
	"🎱 | My reply is no,",
	"🎱 | My sources say no,",
	"🎱 | Outlook not so good,",
	"🎱 | Outlook good,",
	"🎱 | Reply hazy, try again,",
	"🎱 | Signs point to yes,",
	"🎱 | Very doubtful,",
	"🎱 | Without a doubt,",
	"🎱 | You may rely on it,",
	"🎱 | Yes,",
	"🎱 | Yes – definitely,",
];

export default class eightball extends Command {
	constructor() {
		super("eightball", {
			aliases: ["eightball", "8ball"],
			description: {
				content: "8ball will answer all your questions.",
				usage: "8ball <question>",
			},
			args: [
				{
					id: "question",
					type: "string",
					match: "rest",
				},
			],
		});
	}

	exec(message: Message, { question }: { question: string }) {
		if (!question) return this.client.emit("missingArg", message, ["<question>"]);

		const choice = ball[Math.floor(Math.random() * ball.length)];
		return message.util.send(`> ${choice} **${message.author.username}**.`);
	}
}
