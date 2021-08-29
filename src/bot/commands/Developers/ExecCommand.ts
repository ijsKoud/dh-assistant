import { Command } from "../../../client/structures/Command";
import { ApplyOptions } from "@sapphire/decorators";
import { exec, ExecException } from "child_process";
import { codeBlock } from "@sapphire/utilities";
import { Args } from "@sapphire/framework";
import type { Message } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "exec",
	aliases: ["exec", "execute", "terminal"],
	description: "Execute any command using exec",
	preconditions: ["OwnerOnly"],
	usage: "<...command>",
})
export default class ExecCommand extends Command {
	public async run(message: Message, args: Args) {
		const command = await args.rest("string");
		const { result, success } = await this.exec(command);

		const output = success ? codeBlock("js", result) : `**Error**: ${codeBlock("bash", result)}`;

		if (output.length > 2000)
			return message.reply({
				files: [{ attachment: Buffer.from(output), name: "output.txt" }],
				content: "Output was too long... sent the result as a file.",
			});

		return message.reply(`${output}`);
	}

	private async exec(command: string) {
		let success = true;
		let result: string;

		const res = await new Promise<{ error: ExecException | null; stdout: string }>((resolve) =>
			exec(command, (err, stdout) => resolve({ error: err, stdout }))
		);

		if (res.error) {
			success = false;
			result = res.error.message;
		} else {
			result = res.stdout;
		}

		return { result, success };
	}
}
