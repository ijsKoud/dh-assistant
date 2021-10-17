import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";

import { emojis } from "../../../client/constants";
import { GuildMessage } from "../../../client/structures/Moderation";
import { readdir } from "fs/promises";
import { join } from "path";

@ApplyOptions<Command.Options>({
	name: "background",
	description: "Changes the background of your XP card",
	usage: "<background id>",
	preconditions: ["GuildOnly", "PremiumOnly"],
	options: ["user"],
})
export default class BackgroundCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: backgroundId } = await args.pickResult("number");
		if (!backgroundId)
			return message.reply(
				`>>> ${emojis.redcross} | No background Id provided. You can check the Dashboard all the available backgrounds: ${process.env.DASHBOARD}`
			);

		const backgroundCheck = await this.checkBackground(backgroundId);
		if (!backgroundCheck)
			return message.reply(
				`>>> ${emojis.redcross} | Invalid background Id provided. You can check the Dashboard all the available backgrounds: ${process.env.DASHBOARD}`
			);

		await this.client.prisma.level.update({
			where: { id: `${message.author.id}-${message.guildId}` },
			data: { bg: backgroundId },
		});
		await message.reply(
			`>>> ${emojis.greentick} | Successfully updated the background to \`${backgroundId}\`!`
		);
	}

	protected async checkBackground(id: number): Promise<boolean> {
		const backgrounds = await readdir(join(process.cwd(), "assets", "images"));
		if (id === 1) return true;

		return backgrounds.some((str) => str.includes(id.toString()));
	}
}
