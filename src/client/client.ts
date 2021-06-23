import { AkairoClient, CommandHandler, ListenerHandler, InhibitorHandler } from "discord-akairo";
import { WebhookClient, Collection, Message } from "discord.js";
import { connect, connection } from "mongoose";
import { iAutomod, iConfig } from "../models/interfaces";
import { join } from "path";
import moment from "moment";

// classes
import LoggingHandler from "../classes/handlers/loggingHandler";
import ticketHandler from "../classes/handlers/ticketHandler";
import timeoutHandler from "../classes/handlers/timeoutHandler";
import levelManager from "../classes/guild/levelManager";
import Giveaways from "../classes/guild/Giveaways";
import Automod from "../classes/guild/Automod";
import Api from "../classes/api/Api";
import util from "./util";

//data
import * as Emojis from "../data/emojis";
import * as Reponses from "../data/responses";

// logger
import { Logger, LogLevel } from "@dimensional-fun/logger";
const logger = new Logger("DH Assistant v3.1");

// extensions import
import "../extensions/dhMember";
import "../extensions/dhMessage";
import "../extensions/dhGuild";
import "../extensions/dhUser";

// declare
declare module "discord-akairo" {
	interface AkairoClient {
		config: Collection<string, iConfig>;
		Automod: Collection<string, iAutomod>;

		inhibitorHandler: InhibitorHandler;
		commandHandler: CommandHandler;
		listenerHandler: ListenerHandler;

		loggingHandler: LoggingHandler;
		timeoutHandler: timeoutHandler;
		ticketHandler: ticketHandler;

		levelManager: levelManager;
		giveaways: Giveaways;
		Api: Api;
		automod: Automod;
		utils: util;

		log(type: "DEBUG" | "ERROR" | "INFO" | "SILLY" | "TRACE" | "WARN", msg: string): void;

		altdefender: boolean;
		hex: string;
		emoji: typeof Emojis;
		responses: typeof Reponses;
	}
}

declare module "discord.js" {
	interface Message {
		prefix: string;
	}

	interface Guild {
		config: iConfig;
		automod: iAutomod;
	}

	interface GuildMember {
		pending: boolean;
		multiplier: number;
	}

	interface User {
		robloxUser(): Promise<{ rover: string; bloxlink: string }>;
		feedbackBlacklisted: boolean;
	}
}

// client
export default class dhClient extends AkairoClient {
	public config = new Collection<string, iConfig>();
	public Automod = new Collection<string, iAutomod>();

	public loggingHandler = new LoggingHandler(this);
	public ticketHandler = new ticketHandler(this);
	public timeoutHandler = new timeoutHandler(this);

	public levelManager = new levelManager(this);
	public giveaways = new Giveaways(this);
	public automod = new Automod(this);
	public Api = new Api(this);

	private wb: WebhookClient = new WebhookClient(process.env.WB_ID, process.env.WB_TOKEN);
	public utils: util = new util(this);

	public altdefender = false;
	public hex = "#B12024";
	public emoji = Emojis;
	public responses = Reponses;

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
		prefix: ({ prefix }: Message) => prefix,
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
			partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION", "USER"],
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

		[this.commandHandler, this.listenerHandler, this.inhibitorHandler].forEach((x) => x.loadAll());

		this.Api.start();
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
				this.log(
					LogLevel.ERROR,
					`New error - **${connection.name}** - Error: \`${error.stack || error.message}\``
				)
			);
	}

	public async start(): Promise<string> {
		await this._init();
		this.connect();
		return this.login(process.env.TOKEN);
	}

	public async log(
		type: "DEBUG" | "ERROR" | "INFO" | "SILLY" | "TRACE" | "WARN",
		msg: string
	): Promise<void> {
		await this.wb
			.send(
				`\`${moment(Date.now()).format("hh:mm:ss DD-MM-YYYY")}\` **${type}**  ${process.pid}  (**${
					logger.name
				}**): ${msg}`,
				{ split: true }
			)
			.catch((e) => null);
		logger[type.toLowerCase()](msg.replace(/`/g, "").replace(/\*/g, ""));
	}
}
