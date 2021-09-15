import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { Message } from "discord.js";

const levels: Record<"NONE" | "TIER_1" | "TIER_2" | "TIER_3", string> = {
	NONE: "0",
	TIER_1: "1",
	TIER_2: "2",
	TIER_3: "3",
};

@ApplyOptions<Command.Options>({
	name: "serverinfo",
	description: "Shows you the information about this server",
	requiredClientPermissions: ["EMBED_LINKS"],
	preconditions: ["GuildOnly"],
})
export default class ServerinfoCommand extends Command {
	public async run(message: Message): Promise<void> {
		if (!message.guild) return;

		const owner = await message.guild.fetchOwner();
		await message.reply({
			embeds: [
				this.container.client.utils
					.embed()
					.setTitle(`Server Info: ${message.guild.name}`)
					.setThumbnail(
						message.guild.iconURL({ dynamic: true, size: 4096 }) ??
							"https://cdn.daangamesdg.xyz/discord/wumpus.png"
					)
					.setFields([
						{
							name: "• Owner",
							value: `**${owner.user.tag}**\n${owner.toString()}`,
							inline: true,
						},
						{
							name: "• Members",
							value: `**Total**: ${message.guild.memberCount}\n**Users**: ${
								message.guild.members.cache.filter((g) => !g.user.bot).size
							}\n**Bots**: ${message.guild.members.cache.filter((g) => g.user.bot).size}`,
							inline: true,
						},
						{
							name: "• Channels",
							value: `**Voice**: ${
								message.guild.channels.cache.filter((c) => c.isVoice()).size
							}\n**Text**: ${
								message.guild.channels.cache.filter((c) => c.type === "GUILD_TEXT").size
							}\n**Category**: ${
								message.guild.channels.cache.filter((c) => c.type === "GUILD_CATEGORY").size
							}`,
							inline: true,
						},
						{
							name: "• Roles",
							value: `${this.container.client.utils
								.trimArray(message.guild.roles.cache.map((r) => r.toString()).slice(1), 5)
								.join(", ")}`,
							inline: true,
						},
						{
							name: "• Emojis & Stickers",
							value: `**Stickers**: ${message.guild.stickers.cache.size}\n**Emojis**: ${message.guild.emojis.cache.size}`,
							inline: true,
						},
						{
							name: "• Boost status",
							value: `**Boosts**: ${message.guild.premiumSubscriptionCount}\n**Level**: ${
								levels[message.guild.premiumTier]
							}`,
							inline: true,
						},
					]),
			],
		});
	}
}
