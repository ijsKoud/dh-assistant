import { Command } from "../../../client/structures/extensions";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMessage } from "../../../client/structures/Moderation";
import { MessageActionRow, MessageButton, ReplyMessageOptions } from "discord.js";
import moment from "moment";
import { nanoid } from "nanoid";

@ApplyOptions<Command.Options>({
	name: "adrequest",
	description: "Post an ad in <#720986432176652369>",
	usage: "<ad>",
	requiredClientPermissions: ["EMBED_LINKS"],
	preconditions: ["PremiumOnly", "GuildOnly"],
})
export default class AvatarCommand extends Command {
	public async messageRun(message: GuildMessage, args: Command.Args) {
		const { value: ad } = await args.restResult("string");
		if (!ad)
			return message.reply(
				`>>> ${this.client.constants.emojis.redcross} | No ad message provided!`
			);

		const reply = async (options: ReplyMessageOptions | string) => {
			await message.reply(options);
			await message.delete().catch(() => void 0);
		};

		const adrequest = await this.client.prisma.adrequest.findFirst({
			where: { id: { startsWith: message.author.id } },
		});
		if (adrequest)
			return reply(
				`>>> ${this.client.constants.emojis.redcross} | You already created an adrequest, please wait for this one to be accepted or declined.`
			);

		const currentTimeout = this.client.requests.find((_, key) => key === message.author.id);
		if (currentTimeout)
			return reply(
				`>>> ⌚ | You can submit another request ${this.client.utils.formatTime(
					moment(currentTimeout - Date.now()).unix(),
					"R"
				)}!`
			);

		const channel = await this.client.utils.getChannel(this.client.constants.channels.adrequest);
		if (!channel || !channel.isText() || channel.type !== "GUILD_TEXT") {
			reply(
				`>>> ${this.client.constants.emojis.error} | Something went wrong while processing your request, please try again later.`
			);
			return this.client.loggers
				.get("bot")
				?.fatal(
					`[AdrequestCommand]: ${this.client.constants.channels.adrequest} is not a valid "GUILD_TEXT" channel.`
				);
		}

		await message.delete().catch(() => void 0);
		const embed = this.client.utils
			.embed()
			.setAuthor(
				`Adrequest - ${message.author.tag}`,
				message.member.displayAvatarURL({ dynamic: true, size: 512 })
			)
			.setDescription(ad);

		const id = nanoid(12);
		const components = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId(`${id}-accept`)
				.setEmoji(this.client.constants.emojis.greentick)
				.setStyle("SUCCESS"),
			new MessageButton()
				.setCustomId(`${id}-decline`)
				.setEmoji(this.client.constants.emojis.redcross)
				.setStyle("DANGER")
		);
		const msg = await channel.send({ embeds: [embed], components: [components] });
		await this.client.prisma.adrequest.create({
			data: { id: `${message.author.id}-${message.guildId}`, messageId: msg.id, caseId: id },
		});

		this.client.requests.set(message.author.id, Date.now() + 72e5);
		setTimeout(() => this.client.requests.delete(message.author.id), 72e5);
	}
}
