import axios from "axios";
import {
	AwaitMessageComponentOptions,
	AwaitMessagesOptions,
	ButtonInteraction,
	Channel,
	Collection,
	DMChannel,
	Guild,
	Interaction,
	Message,
	MessageActionRow,
	MessageAttachment,
	MessageButton,
	MessageComponentInteraction,
	MessageEmbed,
	MessageEmbedOptions,
	PermissionResolvable,
	PermissionString,
} from "discord.js";
import ms from "ms";
import Client from "./Client";

export default class Utils {
	constructor(public client: Client) {}

	public formatTime(time: number | string, type: "t" | "T" | "d" | "D" | "f" | "F" | "R"): string {
		return `<t:${time}:${type}>`;
	}

	public parseTime(time: string): number {
		const permanent = ["p", "perm", "permanent"];

		time = time.toLowerCase();
		if (permanent.includes(time)) return 0;

		return ms(time);
	}

	public async robloxUser(
		user: string
	): Promise<{ rover: string | null; bloxlink: string | null }> {
		try {
			const { data: rover } = await axios
				.get<{ robloxUsername: string }>("https://verify.eryn.io/api/user/" + user)
				.catch(() => ({ data: null }));
			const { data: bloxlink } = await axios
				.get<{ primaryAccount: string }>("https://api.blox.link/v1/user/" + user)
				.catch(() => ({ data: null }));
			const { data: acc } = await axios
				.get<{ Username: string }>("https://api.roblox.com/users/" + bloxlink?.primaryAccount)
				.catch(() => ({ data: null }));

			return {
				rover: rover?.robloxUsername ?? null,
				bloxlink: acc?.Username ?? null,
			};
		} catch (e) {
			this.client.loggers.get("bot")?.error(e);
			return { rover: null, bloxlink: null };
		}
	}

	public formatPerms(perms: PermissionString[] | PermissionResolvable): string {
		if (!Array.isArray(perms) || perms.length === 0) return "`―`";

		const formattedPerms = perms.map(
			(str) =>
				`\`${str
					.replace(/_/g, " ")
					.replace(/GUILD/g, "SERVER")
					.toLowerCase()
					.replace(/\b(\w)/g, (char) => char.toUpperCase())}\``
		);

		return formattedPerms.length > 1
			? `\`${formattedPerms.slice(0, -1).join("`, `")}\` and \`${formattedPerms.slice(-1)[0]}\``
			: `\`${formattedPerms[0]}\``;
	}

	public embed(options?: MessageEmbedOptions | MessageEmbed): MessageEmbed {
		return new MessageEmbed(options).setColor(process.env.COLOUR as `#${string}`);
	}

	public capitalize(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	public async getChannel(id: string): Promise<Channel | null> {
		const resolve = () => {
			const { cache } = this.client.channels;
			return (
				cache.get(id) ||
				cache.find((channel) =>
					"name" in channel
						? (channel as Channel & { name: string }).name === id
						: channel.toString() === id
				)
			);
		};

		return typeof id === "string"
			? resolve() || (await this.client.channels.fetch(id).catch(() => null))
			: null;
	}

	public async getRole(id: string, guild: Guild) {
		const resolve = () => {
			const { cache } = guild.roles;
			return cache.get(id) || cache.find((role) => role.name === id || role.toString() === id);
		};

		return typeof id === "string" && guild instanceof Guild
			? resolve() || (await guild.roles.fetch(id).catch(() => null))
			: null;
	}

	public async fetchMember(id: string, guild: Guild | null | undefined) {
		const resolve = () => {
			if (!guild) return undefined;

			const { cache } = guild.members;
			return (
				cache.get(id) ||
				cache.find(
					(member) =>
						member.nickname === id ||
						member.toString() === id ||
						member.user.tag === id ||
						member.user.username === id ||
						member.user.toString() === id
				)
			);
		};

		return typeof id === "string" && guild instanceof Guild
			? resolve() || (await guild.members.fetch(id).catch(() => null))
			: null;
	}

	public async fetchUser(id: string) {
		const resolve = () => {
			const { cache } = this.client.users;
			return (
				cache.get(id) ||
				cache.find((user) => user.tag === id || user.username === id || user.toString() === id)
			);
		};

		return typeof id === "string"
			? resolve() || (await this.client.users.fetch(id).catch(() => null))
			: null;
	}

	public isDM(channel: Channel): channel is DMChannel {
		return ["DM", "GROUP_DM"].includes(channel.type);
	}

	public pagination(
		message: Message,
		pages: MessageEmbed[],
		buttons: MessageButton[],
		timeout = 12e4,
		pageNumber = 1
	) {
		let page = pageNumber;
		const ids = buttons.map((c) => c.customId);

		const filter = (i: Interaction) =>
			i.isButton() && i.inGuild() && i.guildId === message.guildId && ids.includes(i.customId);
		const collector = message.channel.createMessageComponentCollector({
			time: timeout,
			filter,
		});

		collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
			switch (buttonInteraction.customId) {
				case ids[0]:
					page = page === 1 ? pages.length : page - 1;
					break;
				case ids[2]:
					page = page === pages.length ? 1 : page + 1;
					break;
				case ids[1]:
					await message.delete().catch(() => void 0);
					collector.stop("deleted");
					break;
				default:
					break;
			}

			await buttonInteraction.deferUpdate().catch(() => void 0);
			await message
				.edit({
					embeds: [pages[page - 1].setFooter(`Page ${page} / ${pages.length}`)],
				})
				.catch(() => void 0);
		});

		collector.on("end", (_, reason) => {
			if (reason === "deleted") return;

			const disabledRow = new MessageActionRow().addComponents(
				buttons[0].setDisabled(true),
				buttons[1].setDisabled(true),
				buttons[2].setDisabled(true)
			);

			message
				.edit({
					embeds: [pages[page - 1].setFooter(`Page ${page} / ${pages.length}`)],
					components: [disabledRow],
				})
				.catch(() => void 0);
		});
	}

	public async awaitComponent(
		message: Message,
		options: AwaitMessageComponentOptions<MessageComponentInteraction> = { time: 6e4 }
	): Promise<MessageComponentInteraction | null> {
		options = { time: 6e4, ...options };
		const coll = await message.awaitMessageComponent(options).catch(() => null);

		return coll;
	}

	public async awaitMessages(
		message: Message,
		options: AwaitMessagesOptions = { time: 6e4, errors: ["time"], max: 1 }
	): Promise<Collection<string, Message>> {
		options = { time: 6e4, errors: ["time"], max: 1, ...options };
		const coll = await message.channel
			.awaitMessages(options)
			.catch(() => new Collection<string, Message>());

		return coll;
	}

	public trimArray(arr: Array<string>, maxLen = 10): string[] {
		if (arr.length > maxLen) {
			const len = arr.length - maxLen;
			arr = arr.slice(0, maxLen);
			arr.push(`${len} more...`);
		}
		return arr;
	}

	public formatBytes(bytes: number): string {
		if (bytes === 0) return "0 Bytes";
		const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
	}

	public getAttachments(attachments: Collection<string, MessageAttachment>): string[] {
		const valid = /^.*(gif|png|jpg|jpeg|mp4|mp3|pdf|psd)$/g;

		return attachments
			.filter((attachment) => valid.test(attachment.url))
			.map((attachment) => attachment.url);
	}
}
