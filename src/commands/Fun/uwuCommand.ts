import { Message } from "discord.js";
import { Command } from "discord-akairo";

const files: string[] = [
	"https://cdn.discordapp.com/attachments/727992822036430859/799944907333828628/UwU_Violation.mp4",
	//"https://cdn.discordapp.com/attachments/571619638182674442/728709803165351955/uwu.mp4",
	"https://cdn.discordapp.com/attachments/563724345478742018/728714872719671337/unknown.png",
	"https://cdn.discordapp.com/attachments/571619638182674442/728714181678989433/unknown.png",
	"uwu rawr xD nuzzles",
	"https://cdn.discordapp.com/attachments/563724345478742018/729396628460666971/unknown.png",
	"https://cdn.discordapp.com/attachments/563724345478742018/729396612622712912/unknown.png",
	"https://cdn.discordapp.com/attachments/563724345478742018/729396590795685999/unknown.png",
	"https://cdn.discordapp.com/attachments/563724345478742018/729396566644883496/unknown.png",
	"https://cdn.discordapp.com/attachments/563724345478742018/729396544784039996/unknown.png",
	"https://cdn.discordapp.com/attachments/563724345478742018/729396522906812546/unknown.png",
	"https://cdn.discordapp.com/attachments/563724345478742018/729396500928659456/unknown.png",
	"https://cdn.discordapp.com/attachments/563724345478742018/729394221294944346/unknown.png",
	"https://media.discordapp.net/attachments/780907238561677322/804100716695126077/unknown.png",
	"https://cdn.discordapp.com/attachments/780907238561677322/822591236316987414/unknown.png",
	"https://media.discordapp.net/attachments/710223624442871970/823296420324704276/unknown.png",
	"https://media.discordapp.net/attachments/710223624442871970/823296417036238888/unknown.png",
];

export default class uwu extends Command {
	constructor() {
		super("uwu", {
			aliases: ["uwu", "owo"],
			description: {
				content: "UwU",
				usage: "uwu",
			},
		});
	}

	exec(message: Message) {
		if (message.channel.type !== "dm" && message.channel.id !== "727992822036430859")
			return message.channel.send(
				`> ${this.client.utils.emojiFinder(
					"meow_uwu"
				)} | You can only use this command in <#727992822036430859> or in DMs.`
			);
		message.util.send(files[Math.floor(Math.random() * files.length)]);
	}
}
