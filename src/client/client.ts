import { ListenerHandler, CommandHandler, AkairoClient, InhibitorHandler } from "discord-akairo";
import { WebhookClient, Message } from "discord.js";
import { connect, connection } from "mongoose";
import * as config from "../config";
import { join } from "path";
import util from "./util";
import moment from "moment";

import { Logger, LogLevel } from "@melike2d/logger";
const logger = new Logger("DH Assistant v3");

// classes
import Automod from "../classes/Automod";
import LevelManager from "../classes/LevelManager";
import Giveaway from "../classes/Giveaway";
import Api from "../classes/Api";

// extensions
import "../extensions/dhMember";
import "../extensions/dhUser";

// declare
declare module "discord-akairo" {
	interface AkairoClient {
		inhibitorHandler: InhibitorHandler;
		commandHandler: CommandHandler;
		listenerHandler: ListenerHandler;

		utils: util;

		Api: Api;
		automod: Automod;
		levelManager: LevelManager;
		giveaway: Giveaway;

		map: Map<string, timeoutObj>;

		hex: string;

		config: typeof config;
		messages: {
			[x: string]: string;
		};
		colours: {
			[x: string]: string;
		};

		mod: {
			altDefender: boolean;
			automod: boolean;
			tickets: boolean;
		};

		log(type: "DEBUG" | "ERROR" | "INFO" | "SILLY" | "TRACE" | "WARN", msg: string): void;
		tagscript(msg: string, vars?: Record<string, any>): string;
	}
}

declare module "discord.js" {
	interface GuildMember {
		pending: boolean;
		multiplier: number;
	}

	interface User {
		robloxUser(): Promise<{ rover: string; bloxlink: string }>;
		feedbackBlacklisted: boolean;
	}
}

interface timeoutObj {
	guildId: string;
	userId: string;
	type: "ban" | "mute";
	timer: NodeJS.Timeout;
}

// client
export default class dhClient extends AkairoClient {
	private wb: WebhookClient = new WebhookClient(process.env.WB_ID, process.env.WB_TOKEN);
	public utils: util = new util(this);

	public Api: Api = new Api(this);
	public automod: Automod = new Automod(this);
	public levelManager = new LevelManager(this);
	public giveaway = new Giveaway(this);

	public hex = "#A31422";

	public mod = {
		altDefender: true,
		automod: true,
		tickets: true,
	};

	public config = config;
	public messages = {
		noUser: "I was unable to find a user called: **{USER}**.",
		DM: ">>> 💡 | **{TYPE} - {GUILD}**\n{REASON}",
		error:
			">>> ❗ | **{CMD} command - Error**:```xl\n{e}```ℹ | This issue is reported to our developers, sorry for the inconvience.",
	};
	public colours = {
		red: "#DA5C59",
		green: "#4AF3AB",
		pink: "#FD6CE1",
		orange: "#F3884A",
		yellow: "#FFF68B",
	};

	public map: Map<string, timeoutObj> = new Map();

	public inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, {
		directory: join(__dirname, "..", "inhibitors"),
		automateCategories: true,
	});
	public listenerHandler: ListenerHandler = new ListenerHandler(this, {
		directory: join(__dirname, "..", "events"),
		automateCategories: true,
	});
	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, "..", "commands"),
		prefix: process.env.PREFIX,
		allowMention: true,
		automateCategories: true,
		blockBots: true,
		blockClient: true,
		commandUtil: true,
		handleEdits: true,
		commandUtilLifetime: 3e5,
		defaultCooldown: 1e3,
		argumentDefaults: {
			prompt: {
				modifyStart: (_: Message, str: string): string =>
					`${str} \n\nType \`cancel\` to cancel the command!`,
				modifyRetry: (_: Message, str: string): string =>
					`${str} \n\nType \`cancel\` to cancel the command!`,
				timeout: "This took longer then expected, the command is canceled now!",
				ended: "Please take a break, try again later.",
				cancel: "Command is canceled!",
				retries: 3,
				time: 3e4,
			},
			otherwise: "",
		},
		ignorePermissions: this.ownerID,
		ignoreCooldown: this.ownerID,
	});

	public constructor({ ownerID }: { ownerID: string[] }) {
		super({
			ownerID,
			disableMentions: "everyone",
			partials: ["USER", "REACTION", "MESSAGE", "GUILD_MEMBER", "CHANNEL"],
		});
	}

	private async _init(): Promise<void> {
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);

		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			listenerHandler: this.listenerHandler,
			process,
		});

		[
			this.commandHandler,
			this.listenerHandler,
			this.inhibitorHandler,
			this.Api,
			this.giveaway,
		].forEach((x) => x.loadAll());
	}

	public tagscript(msg: string, vars: Record<string, any> = {}) {
		if (typeof msg === "string")
			Object.keys(vars).forEach(
				(key) => (msg = msg.replace(new RegExp(`{${key}}`, "gi"), vars[key]))
			);

		return msg;
	}

	private connect(): void {
		connect(process.env.DB, {
			useCreateIndex: true,
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
		});

		connection
			.on("connecting", () =>
				this.log(LogLevel.INFO, `Connecting to **${connection.name}** database...`)
			)
			.once("connected", () =>
				this.log(LogLevel.INFO, `Successfully connected to database: **${connection.name}**!`)
			)
			.on("reconnected", () =>
				this.log(LogLevel.INFO, `Successfully re-connected to database: **${connection.name}**!`)
			)
			.on("disconnected", () =>
				this.log(LogLevel.WARN, `Disconnected from **${connection.name}**! Reconnecting...`)
			)
			.on("error", (error: Error) =>
				this.log(LogLevel.ERROR, `New error - **${connection.name}** - Error: \`${error.message}\``)
			);
	}

	public async start(): Promise<string> {
		await this._init();
		this.connect();
		return this.login(process.env.TOKEN);
	}

	public log(type: "DEBUG" | "ERROR" | "INFO" | "SILLY" | "TRACE" | "WARN", msg: string): void {
		this.wb.send(
			`\`${moment(Date.now()).format("hh:mm:ss DD-MM-YYYY")}\` **${type}**  ${process.pid}  (**${
				logger.name
			}**): ${msg}`,
			{ split: true }
		);
		logger[type.toLowerCase()](msg.replace(/`/g, "").replace(/\*/g, ""));
	}
}
