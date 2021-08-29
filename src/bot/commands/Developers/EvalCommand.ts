import { Command } from "../../../client/structures/Command";
import { ApplyOptions } from "@sapphire/decorators";
import { codeBlock } from "@sapphire/utilities";
import { Args } from "@sapphire/framework";
import type { Message } from "discord.js";
import { Type } from "@sapphire/type";
import { inspect } from "util";

@ApplyOptions<Command.Options>({
	name: "eval",
	aliases: ["ev", "eval", "e"],
	description: "Evals any JavaScript code 💻",
	flags: ["async", "hidden", "showHidden", "silent", "s"],
	options: ["depth"],
	preconditions: ["OwnerOnly"],
	usage: "<code>",
})
export default class EvalCommand extends Command {
	public async run(message: Message, args: Args) {
		const code = await args.rest("string");

		const { result, success, type } = await this.eval(message, code, {
			async: args.getFlags("async"),
			depth: Number(args.getOption("depth")) ?? 0,
			showHidden: args.getFlags("hidden", "showHidden"),
		});

		const output = success ? codeBlock("js", result) : `**Error**: ${codeBlock("bash", result)}`;
		if (args.getFlags("silent", "s")) return null;

		const typeFooter = `**Type**: ${codeBlock("typescript", type)}`;

		if (output.length > 2000)
			return message.reply({
				files: [{ attachment: Buffer.from(output), name: "output.txt" }],
				content: `Output was too long... sent the result as a file.\n\n${typeFooter}`,
			});

		return message.reply(`${output}\n${typeFooter}`);
	}

	private async eval(
		msg: Message,
		code: string,
		flags: { async: boolean; depth: number; showHidden: boolean }
	) {
		if (flags.async) code = `(async () => {\n${code}\n})();`;

		// otherwise "message is not defined"
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const message = msg;
		let success = true;
		let result = null;

		try {
			result = await eval(code);
		} catch (error) {
			result = error;
			success = false;
		}

		const type = new Type(result).toString();

		if (typeof result !== "string")
			result = inspect(result, {
				depth: flags.depth,
				showHidden: flags.showHidden,
			});

		return { result, success, type };
	}
}
