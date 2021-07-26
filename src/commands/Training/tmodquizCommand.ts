import { Message, MessageEmbed, MessageReaction, User } from "discord.js";
import { Command } from "discord-akairo";

const questions = [
	{
		type: 1,
		msg: "How many warnings should you give before a mute?\n\n1️⃣ - One\n2️⃣ - Five\n3️⃣ - Three\n4️⃣ - None",
		reactions: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"],
		correct: "3️⃣",
	},
	{
		type: 1,
		msg: "Who should you ask if you want someone to be banned?\n\n1️⃣ - Another mod\n2️⃣ - A Head of Department+\n3️⃣ - A member of the senior team\n4️⃣ - The first person you see",
		reactions: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"],
		correct: "3️⃣",
	},
	{
		type: 1,
		msg: "When do you need to file an LOA?\n\n:one: - If you will be inactive for three days+\n:two: - If you will be inactive for seven days+\n:three: - If you will be inactive for a day+\n:four: - If you will be inactive for two weeks+",
		reactions: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"],
		correct: "2️⃣",
	},
	{
		type: 1,
		msg: "Who can you ask for a second opinion on moderation?\n\n:one: - Any staff member\n:two: - The Mod Manager\n:three: - The senior team\n:four: - The owner",
		reactions: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"],
		correct: "1️⃣",
	},
	{
		type: 1,
		msg: "What is a valid reason for being inactive for over a week without filing an LOA?\n:one: - Cause of an emergency / you physically not being able to be on your device\n:two: - Cause you have lost motivation\n:three: - Cause you were dared to (don't know who would dare you to do that but we move on)\n:four: - Cause you are going on holiday",
		reactions: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"],
		correct: "1️⃣",
	},
	{
		type: 1,
		msg: "What should you do if someone starts posting NSFW images in #general?\n\n:one: - Do nothing and let it continue, allowing the offender to stop through not giving them any attention\n:two: - Delete them\n:three: - Panic and ping every staff member you can\n:four: - Tell the senior team immediately to have the user banned, and delete the content in the meantime, selecting the 'Report to Trust and Safety' option",
		reactions: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"],
		correct: "4️⃣",
	},
	{
		type: 1,
		msg: "What should you do if someone posts a meme containing foul language in #memes?\n:one: - Nothing, it is not against the rules\n:two: - Delete the message and warn them using the bot\n:three: - Kick them from the server\n:four: - Ping the senior team",
		reactions: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"],
		correct: "1️⃣",
	},
	{
		type: 2,
		msg: "What would you do if someone is implicitly trying to suggest something sexual through their messages? This question is based on opinion, therefore there is no definite right or wrong answer.",
		reactions: [],
		correct: "",
	},
	{
		type: 2,
		msg: "Your friend has joined the server but is breaking the rules by spamming and bypassing the message filter. What do you do?",
		reactions: [],
		correct: "",
	},
	{
		type: 2,
		msg: "One of your Mod colleagues have told you that they are secretly leaking messages in staff channels / moderation resources such as the handbook. What do you do?",
		reactions: [],
		correct: "",
	},
];

export default class tmodquizCommand extends Command {
	constructor() {
		super("tmodquiz", {
			aliases: ["tmodquiz"],
			clientPermissions: ["MANAGE_MESSAGES"],
			channel: "guild",
			cooldown: 1e3,
			args: [
				{
					id: "code",
				},
			],
		});
	}

	async exec(message: Message, { code }: { code: string }) {
		const entry = this.client.trainingCodes.get(code);
		if (!entry) return message.util.send("Invalid code provided.");

		if (entry !== message.author.id)
			return message.util.send("The provided access code is not for this user.");

		try {
			const dm = await message.author.createDM();
			await dm.send(
				">>> ◻ | **Trail Mod Quiz**\nThis quiz has 7 multiple choice and 3 written questions. Good luck!"
			);

			this.client.trainingCodes.delete(code);

			let i = 1;
			const answers: { question: string; answer: string; correct: boolean | null }[] = [];
			for (const q of questions) {
				if (i === 1) await dm.send("**✔ Section 1: Multiple Choice (7q)**");
				if (i === 8) await dm.send("**✏ Section 2: Written Questions (3q)**");

				if (q.type === 1) {
					const msg = await dm.send(q.msg);
					await Promise.all(q.reactions.map((r) => msg.react(r)));

					const filter = (reaction: MessageReaction, user: User) =>
						q.reactions.includes(reaction.emoji.name) && user.id === message.author.id;
					const raw = await this.client.utils.awaitReactions(msg, filter);
					const reaction = raw.first()?.emoji.name;
					if (!reaction) {
						await dm.send("No reaction received, ending the quiz...");
						break;
					}

					answers.push({ question: q.msg, answer: reaction, correct: reaction === q.correct });
				} else {
					const msg = await dm.send(`${q.msg}\n\nNote: answers are shortened to 1024 characters.`);

					const filter = (msg: Message) => msg.author.id === message.author.id;
					const raw = await this.client.utils.awaitMessages(msg, filter);
					const m = raw.first()?.content;
					if (!m) {
						await dm.send("No message received, ending the quiz...");
						break;
					}

					answers.push({ question: q.msg, answer: m, correct: null });
				}

				i++;
			}

			const submit = await dm.send(
				`>>> <a:loading:828410016229883955> | **Submitting your answers, please wait**`
			);
			const channel = await this.client.utils.getChannel("789521547751981106");
			await channel.send(
				new MessageEmbed()
					.setColor(this.client.hex)
					.setTitle("Quiz Results")
					.setAuthor(
						`${message.author.tag}`,
						message.author.displayAvatarURL({ dynamic: true, size: 4096 })
					)
					.addFields(
						answers.map((v) => ({
							name: v.question.substr(0, 256),
							value: `${v.correct !== null ? `(${v.correct ? "correct" : "incorrect"}) - ` : ""}${
								v.answer
							}`.slice(0, 1024),
						}))
					)
			);

			await submit.edit(
				">>> ✔ | This is the end of the test, a Manager+ will assess your answers and contact you when they are finished."
			);
		} catch (e) {
			await message.util.send("I can't DM you, please open your DMs to start the quiz.");
		}
	}
}
