import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Message } from "discord.js";

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

@ApplyOptions<Command.Options>({
	name: "eightball",
	aliases: ["8ball"],
	description: "8ball will answer all your questions.",
	usage: "<question>",
	requiredClientPermissions: ["EMBED_LINKS"],
})
export default class PingCommand extends Command {
	public async messageRun(message: Message, args: Command.Args) {
		const { value: question } = await args.restResult("string");
		if (!question || !question.trim().endsWith("?"))
			return message.reply(
				`>>> ${this.client.constants.emojis.redcross} | A question with a **?** is required!`
			);

		await message.reply(
			`>>> ${ball[Math.floor(Math.random() * ball.length)]} **${message.author.username}**.`
		);
	}
}
