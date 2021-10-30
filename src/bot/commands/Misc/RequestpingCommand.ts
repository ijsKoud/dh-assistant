import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage } from "../../../client/structures/Moderation";
import { MessageActionRow, MessageButton } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "requestping",
	description: "Request an event ping",
	requiredClientPermissions: ["EMBED_LINKS"],
	preconditions: ["GuildOnly", "CetOnly"],
})
export default class RequestpingCommand extends Command {
	public async messageRun(message: GuildMessage): Promise<void> {
		if (message.channel.id !== this.client.constants.channels.cetChannel) return;

		const channel = await this.client.utils.getChannel(this.client.constants.channels.pingrequest);
		if (!channel || !channel.isText() || channel.type !== "GUILD_TEXT") return;

		const embed = this.client.utils
			.embed()
			.setTitle("🔔 Ping request")
			.setDescription(`Requested by ${message.member.toString()}`);
		const components = new MessageActionRow().addComponents(
			new MessageButton()
				.setStyle("SUCCESS")
				.setEmoji(this.client.constants.emojis.greentick)
				.setCustomId("pingrequest-accept"),
			new MessageButton()
				.setStyle("DANGER")
				.setEmoji(this.client.constants.emojis.redcross)
				.setCustomId("pingrequest-decline")
		);

		await channel.send({
			embeds: [embed],
			components: [components],
		});

		await message.react(this.client.constants.emojis.greentick);
	}
}
