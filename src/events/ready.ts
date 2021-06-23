import { Guild } from "discord.js";
import { Listener } from "discord-akairo";
import Config from "../models/guild/Config";
import Automod from "../models/guild/Automod";
import TicketConfig from "../models/tickets/TicketConfig";
import fetch from "node-fetch";

export default class ready extends Listener {
	constructor() {
		super("ready", {
			emitter: "client",
			event: "ready",
		});
	}

	async exec() {
		await Promise.all(this.client.guilds.cache.map(async (g) => await this.loadConfig(g)));
		await this.client.timeoutHandler.loadAll();
		await this.client.giveaways.loadAll();
		await this.setStatus();

		this.client.log("INFO", `**${this.client.user.tag}** has logged in!`);
	}

	async loadConfig(g: Guild) {
		// general
		const Gschema =
			(await Config.findOne({ guildId: g.id })) || (await Config.create({ guildId: g.id }));
		this.client.config.set(g.id, Gschema.toObject());

		// automod
		const Aschema =
			(await Automod.findOne({ guildId: g.id })) || (await Automod.create({ guildId: g.id }));
		this.client.Automod.set(g.id, Aschema.toObject());

		// automod
		(await TicketConfig.findOne({ guildId: g.id })) ||
			(await TicketConfig.create({ guildId: g.id }));
	}

	async setStatus() {
		await this.client.user.setStatus("dnd");

		const url: string =
			"https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCkMrp3dJhWz2FcGTzywQGWg&key=" +
			process.env.YOUTUBE_API_KEY;

		const data = await (await fetch(url)).json().catch((e) => {
			this.client.log("ERROR", `Youtube Fetch Error: \`\`\`${e.stack || e.message}\`\`\``);
			return { items: [{ statistics: { subscriberCount: "unkown" } }] };
		});
		const subCount = data.items[0].statistics.subscriberCount;
		this.client.user.setActivity(`with ${subCount} subscribers!`, {
			type: "PLAYING",
		});

		setInterval(async () => {
			try {
				const data = await (await fetch(url)).json().catch((e) => {
					this.client.log("ERROR", `Youtube Fetch Error: \`\`\`${e.stack || e.message}\`\`\``);
					return { items: [{ statistics: { subscriberCount: "unkown" } }] };
				});
				const subCount = data.items[0].statistics.subscriberCount;
				this.client.user.setActivity(`with ${subCount} subscribers!`, {
					type: "PLAYING",
				});
			} catch (e) {
				this.client.log("ERROR", `Status update error: \`\`\`${e.stack || e.message}\`\`\``);
			}
		}, 6e5);
	}
}
