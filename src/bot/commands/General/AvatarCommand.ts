import { Command } from "../../../client/structures/Command";
import { ApplyOptions } from "@sapphire/decorators";
import { Message } from "discord.js";
import { Args } from "@sapphire/framework";

@ApplyOptions<Command.Options>({
	name: "avatar",
	description: "Shows the avatar of a user",
	usage: "[user]",
	requiredClientPermissions: ["EMBED_LINKS"],
})
export default class AvatarCommand extends Command {
	public async run(message: Message, args: Args): Promise<void> {
		let { value: user } = await args.pickResult("user");
		if (!user) user = message.author;

		await message.reply({
			embeds: [
				this.container.client.utils
					.embed()
					.setTitle(`Avatar of ${user.tag}`)
					.setImage(user.displayAvatarURL({ dynamic: true, size: 4096 })),
			],
		});
	}
}
