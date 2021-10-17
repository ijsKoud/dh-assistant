import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { EmbedFieldData, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import ms from "ms";
import { Args } from "@sapphire/framework";

@ApplyOptions<Command.Options>({
	name: "help",
	aliases: ["commands"],
	description: "A list of all the commands",
	usage: "[command]",
	requiredClientPermissions: ["EMBED_LINKS"],
})
export default class PingCommand extends Command {
	public async messageRun(message: Message, args: Args, context: Command.Context): Promise<void> {
		const embed: MessageEmbed = this.container.client.utils
			.embed()
			.setTitle(`Help Command - ${message.author.tag}`)
			.setFooter(
				"DH Assistant created by DaanGamesDG#7621",
				"https://static.daangamesdg.xyz/discord/pfp.gif"
			);

		const cmd = await args.pickResult("string");
		const command = this.container.stores.get("commands").get(cmd.value ?? "") as
			| Command
			| undefined;

		if (command) {
			const userPermissions = this.container.client.utils.formatPerms(command.permissions);
			const clientPermissions = this.container.client.utils.formatPerms(command.clientPermissions);

			embed.setDescription(
				[
					`>>> 🏷 | **Name**: ${command.name}`,
					`📁 | **Category**: ${command.category}`,
					`🔖 | **Aliases**: \`${command.aliases.join("`, `") || "-"}\`\n`,
					`📋 | **Usage**: ${command.usage ? `${context.commandPrefix}${command.usage}` : "-"}`,
					`📘 | **Description**: ${command.description ?? "-"}\n`,
					`👮‍♂️ | **User Permissions**: ${userPermissions ?? "-"}`,
					`🤖 | **Client Permissions**: ${clientPermissions ?? "-"}`,
					`⌚ | **Cooldown**: \`${ms(command.cooldown, { long: false })}\``,
					`🔢 | **Cooldown Limit**: \`${command.cooldownLimit}\``,
				].join("\n")
			);
		} else {
			const isOwner = this.container.client.isOwner(message.author.id);
			const commands = [...this.container.stores.get("commands").values()] as Command[];
			let categories = [...new Set(commands.map((c) => c.category))];

			if (!isOwner) categories = categories.filter((c) => c.toLowerCase() !== "dev");

			const fields: EmbedFieldData[] = categories.map((category) => {
				const valid = commands.filter((c) => c.category === category);
				const filtered = isOwner ? valid : valid.filter((c) => !c.hidden || !c.OwnerOnly);

				return {
					name: `• ${category}`,
					value: filtered.map((c) => `\`${c.name ?? c.aliases[0] ?? "unkown"}\``).join(" "),
				};
			});

			embed.setFields(fields);
		}

		const createButton = (url: string, label: string): MessageButton =>
			new MessageButton().setURL(url).setStyle("LINK").setLabel(label);
		const component = new MessageActionRow().addComponents(
			createButton("https://daangamesdg.wtf/github/dh-assistant", "GitHub"),
			createButton(process.env.DASHBOARD ?? "https://daangamesdg.wtf/notfound", "Dashboard")
		);
		await message.reply({ embeds: [embed], components: [component] });
	}
}
