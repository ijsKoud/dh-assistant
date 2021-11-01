import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import type { Message } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "avatar",
	description: "Shows the avatar of a user",
	usage: "[user]",
	requiredClientPermissions: ["EMBED_LINKS"]
})
export default class AvatarCommand extends Command {
	public async messageRun(message: Message, args: Command.Args): Promise<void> {
		let { value: user } = await args.pickResult("user");
		if (!user) user = message.author;

		await message.reply({
			embeds: [
				this.container.client.utils
					.embed()
					.setTitle(`Avatar of ${user.tag}`)
					.setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
			]
		});
	}
}
