import { Message, MessageCollector, MessageEmbed } from "discord.js";

export class Tictactoe {
	private message: Message;
	private embed!: MessageEmbed;
	private embedMsg!: Message;
	private collector!: MessageCollector;

	private redTurn = true;
	private id: string[] = [];
	private inGame = false;

	public board: string[] = ["⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜"];

	private filter = (m: Message) => {
		return (
			!!m.content &&
			m.author.id === this.id[this.redTurn ? 0 : 1] &&
			!isNaN(parseInt(m.content.split("")[0])) &&
			[1, 2, 3, 4, 5, 6, 7, 8, 9].includes(parseInt(m.content.split("")[0]))
		);
	};

	public constructor(message: Message, users: string[]) {
		this.message = message;
		this.id.push(...users);
	}

	public async start(): Promise<void> {
		this.redTurn = Math.random() < 0.5 ? true : false;
		this.inGame = true;

		this.embed = new MessageEmbed()
			.setDescription(this.description)
			.setColor("#058DFA")
			.addField(
				"• How to play",
				"Send the position (number) you want to take to this channel, I will delete your message and give the position to you. If someone has 3 in a row that user wins."
			)
			.addField("• Users", `<@${this.id[0]}> = **Red** - <@${this.id[1]}> = **Blue**`);

		this.embedMsg = await this.message.channel.send({
			content: `TicTacToe: ${this.id.map((id) => `<@${id}>`).join(" **vs** ")}!`,
			embeds: [this.embed],
		});
		this.awaitResponse();
	}

	private Guessed(number: number): void {
		if (!this.inGame) return;
		if (this.board.find((_, i) => i + 1 === number) !== "⬜") return;

		const newboard: string[] = [];
		this.board.forEach((v, i) =>
			i + 1 === number ? newboard.push(this.redTurn ? "🟥" : "🟦") : newboard.push(v)
		);

		this.board = newboard;
		this.redTurn = !this.redTurn;

		const check = this.check();
		if (check) return this.gameOver(check === "🟥" ? true : false, check === "🟦" ? true : false);

		this.embed.setDescription(this.description);
		this.embedMsg.edit({ embeds: [this.embed] });
	}

	private gameOver(redWon: boolean, blueWon: boolean): void {
		this.inGame = false;

		this.collector.stop("gameOver");
		this.embedMsg.reactions.removeAll();

		this.embed = new MessageEmbed();

		if (!redWon && !blueWon)
			this.embed
				.setDescription(
					`No one won the game... How?! Better luck next time, want to play another game?\nRun \`${process.env.PREFIX}tictactoe <user id/name/tag/mention>\` to start a new game.`
				)
				.setColor("#DC5E55");
		else
			this.embed
				.setDescription(
					`${
						redWon ? "**Red**" : blueWon ? "**Blue**" : "No one"
					} won the game, congrats! 🥳 want to play another game?\nRun \`${
						process.env.PREFIX
					}tictactoe <user id/name/tag/mention>\` to start a new game.`
				)
				.setColor("#4AF3AB");

		this.embedMsg.edit({ embeds: [this.embed] });
	}

	private get description(): string {
		const arr: string[] = [];

		for (let i = 0; i < 3; i++) {
			const j = i * 3 + 3;
			arr.push(this.board.slice(i * 3, j).join(""));
		}

		return `\`\`\`${arr.join("\n")}\`\`\` ${
			this.redTurn ? "**Red**" : "**Blue**"
		} has to choose now.`;
	}

	private awaitResponse(): void {
		this.collector = this.embedMsg.channel.createMessageCollector({
			filter: this.filter,
			time: 6e4 * 3,
		});

		this.collector.on("collect", (m: Message) => {
			m.delete();
			this.Guessed(parseInt(m.content.split("")[0]));
		});

		this.collector.on("end", (_, reason) => {
			if (reason.includes("gameOver")) return;
			this.gameOver(false, false);
		});
	}

	private check(): string | null {
		// Check horizontally
		for (let row = 0; row < 3; row++) {
			const i1 = this.toIndex(row, 0);
			const i2 = this.toIndex(row, 1);
			const i3 = this.toIndex(row, 2);

			if (this.validEquals(i1, i2) && this.validEquals(i2, i3)) return this.board[i1];
		}

		// Check vertically
		for (let i = 0; i < 3; i++) {
			const i1 = this.toIndex(0, i);
			const i2 = this.toIndex(1, i);
			const i3 = this.toIndex(2, i);

			if (this.validEquals(i1, i2) && this.validEquals(i2, i3)) return this.board[i1];
		}

		// Check diagonals
		const middle = this.toIndex(1, 1);
		const topLeft = this.toIndex(0, 0);
		const topRight = this.toIndex(0, 2);
		const bottomRight = this.toIndex(2, 2);
		const bottomLeft = this.toIndex(2, 0);

		if (this.validEquals(topLeft, middle) && this.validEquals(middle, bottomRight))
			return this.board[middle];
		if (this.validEquals(topRight, middle) && this.validEquals(middle, bottomLeft))
			return this.board[middle];

		if (this.board.filter((v) => v === "⬜").length == 0) return "none";

		return null;
	}

	private validEquals(position1: number, position2: number): boolean {
		return this.board[position1] !== "⬜" && this.board[position1] === this.board[position2];
	}

	private toIndex(row: number, column: number): number {
		return row * 3 + column;
	}
}
