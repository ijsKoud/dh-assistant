import { Message, MessageEmbed, MessageCollector } from "discord.js";
import ranWords from "random-words";

export default class hangMan {
  private message: Message;
  private embed: MessageEmbed;
  private embedMsg: Message;
  private collector: MessageCollector;

  private word: string = "";
  private guessed: string[] = [];
  private letters: string[] = [
    "a", "b", "c", "d", "e", "f",
    "g", "h", "i", "j", "k", "l",
    "m", "n", "o", "p", "q", "r",
    "s", "t", "u", "v", "w", "x",
    "y", "z",
  ];

  private wrong: number = 0;
  private filter = (m: Message) => {
    return m.content 
    && m.author.id === this.message.author.id
  };
  

  public constructor(message: Message) {
    this.message = message;
  }
  
  public async start(): Promise<void> {
    this.word = ranWords(1)[0];

    this.embed = new MessageEmbed()
      .setDescription(this.description)
      .setColor("#058DFA")
      .addField("• How to play?", 
        "It's really simple, you send a message to this channel containing a letter and I will check if it's in thw word. If it's not I will add a part of the person to the embed, otherwise I will add it to the word."
      )
      .addField("• Other information:", 
        "In 3 minutes you will need to guess the word, you can only make 7 mistakes. If you hit the limit, the game will end and you lost. If you guessed the word, the game will end and you won the game."
      );

    this.embedMsg = await this.message.channel.send(this.embed);
    this.awaitResponse();
  }
  
  private Guessed(letter: string): void {
    if (!this.guessed.includes(letter)) {
      this.guessed.push(letter);

      if (this.word.indexOf(letter) == -1) {
          this.wrong++;
          this.letters = this.letters.filter(l => l !== letter);

          if (this.wrong > 7) return this.gameOver(false);

      } else if (!this.word.split("").map(l => this.guessed.includes(l) ? l : "_").includes("_")) return this.gameOver(true);
    }

    this.embed.setDescription(this.description);
    this.embedMsg.edit(this.embed);
  }

  private gameOver(won: boolean): void {
    this.collector.stop("gameOver");
    this.embed = new MessageEmbed()
      .setDescription(`Game Over! You ${won ? "**won**" : "**lost**"} this round, ${won ? "congrats! 🥳" : "better luck next time!"}\n The word was: ${this.word}`)
      .setColor(won ? "#4AF3AB" : "#DC5E55")
      .spliceFields(0, this.embed.fields.length);

    this.embedMsg.edit(this.embed);
  };

  private get description(): string {
    return [
      "```",
      "|‾‾‾‾‾‾‾‾‾‾‾|",
      `|          ${this.wrong > 0 ? "🎩" : ""}`,
      `|          ${this.wrong > 6 ? "☠" : this.wrong > 1 ? "😮" : ""}`,
      `|          ${this.wrong > 2 ? "🧥" : ""}`,
      `|          ${this.wrong > 3 ? "👖" : ""}`,
      `|          ${this.wrong > 5 ? "👞👞" : this.wrong > 4 ? "👞" : ""}`,
      "|_____________",
      "```",
      `Quessed: ${this.guessed.length ? this.guessed.join(", ") : "None"}\n`,
      `Word: ${this.word.split("").map(l => this.guessed.includes(l) ? l : "**_**").join(" ")}`
    ].join("\n");
  }

  private awaitResponse(): void {
    this.collector = this.embedMsg.channel
      .createMessageCollector(this.filter, { time: 6e4 * 3 });

    this.collector.on("collect", (m: Message) => {
      const split = m.content.split("")[0].toLowerCase();
      m.delete();
      this.Guessed(split);
    });

    this.collector.on("end", (_, reason) => {
      if (reason.includes("gameOver")) return;
      this.gameOver(false);
    })
  }
}