/* eslint-disable @typescript-eslint/no-explicit-any */
import { SapphireClient } from "@sapphire/framework";
import { BitFieldResolvable, Collection, IntentsString, PartialTypes } from "discord.js";
import { join } from "path";
import { Logger } from "./structures/extensions";
import Utils from "./Utils";
import { PrismaClient } from "@prisma/client";
import { LevelManager, BlacklistManager } from "./structures/managers";
import { PermissionHandler } from "./structures/handlers";
import { Automod } from "./structures/Moderation";
import LoggingHandler from "./structures/handlers/LoggingHandler";
import { TicketHandler } from "./structures/handlers/TicketHandler";
import { GiveawaysManager } from "discord-giveaways";
import { Constants } from "./types";
import { readFileSync } from "fs";
import { AuthCookie } from "./structures/Api";

export default class Client extends SapphireClient {
	public owners: string[];

	public constants: Constants = JSON.parse(
		readFileSync(join(process.cwd(), "config", "constants.json"), {
			encoding: "utf-8"
		})
	);

	public prisma = new PrismaClient();
	public utils = new Utils(this);

	public automod = new Automod(this);

	// @ts-ignore currently not compatible with Djs v13.3.0+
	public giveawaysManager = new GiveawaysManager(this, {
		storage: join(process.cwd(), "data", "giveaways.json"),
		default: {
			botsCanWin: false,
			embedColor: "#37625d"
		}
	});

	public levelManager = new LevelManager(this);
	public blacklistManager = new BlacklistManager(this);

	public ticketHandler = new TicketHandler(this);
	public permissionHandler = new PermissionHandler(this);
	public loggingHandler = new LoggingHandler(this);

	public requests = new Collection<string, number>();
	public loggers = new Collection<string, Logger>();
	public multipliers = new Collection<string, number>();
	public ApiCache = new Collection<string, any>();

	public constructor(options: ClientOptions) {
		super({
			intents: options.intents,
			allowedMentions: { users: [], repliedUser: false, roles: [] },
			baseUserDirectory: join(__dirname, "..", "bot"),
			defaultPrefix: process.env.PREFIX,
			partials: options.partials,
			loadDefaultErrorListeners: false
		});

		this.owners = options.owners;

		const botLogger = new Logger({ name: "BOT", webhook: process.env.LOGS });
		this.loggers.set("bot", botLogger);

		const DataLogger = new Logger({ name: "DB", webhook: process.env.LOGS });
		this.loggers.set("db", DataLogger);

		const GiveawayLogger = new Logger({ name: "Giveaways", webhook: process.env.LOGS });
		this.loggers.set("giveaways", GiveawayLogger);

		if (options.debug)
			this.on("debug", (msg) => {
				botLogger.debug(msg);
			});

		process.on("unhandledRejection", this.handleRejection.bind(this));
	}

	public isOwner(id: string): boolean {
		return this.owners.includes(id);
	}

	public async start(): Promise<void> {
		await this.prisma.$connect();
		this.loggers.get("db")?.info("Successfully connected to postgreSQL Database via Prisma!");

		const blacklisted = await this.prisma.botBlacklist.findMany();
		this.blacklistManager.setBlacklisted(blacklisted.map((b) => b.id));

		await this.login(process.env.TOKEN);
	}

	private handleRejection(reason: unknown) {
		this.loggers.get("bot")?.error("Unhandled rejection: ", reason);
	}
}

interface ClientOptions {
	intents: BitFieldResolvable<IntentsString, number>;
	owners: string[];
	partials?: PartialTypes[] | undefined;
	debug?: boolean;
}

declare module "@sapphire/framework" {
	// eslint-disable-next-line @typescript-eslint/no-shadow
	class SapphireClient {
		public owners: string[];

		public constants: Constants;
		public prisma: PrismaClient;
		public utils: Utils;

		public automod: Automod;

		public levelManager: LevelManager;
		public blacklistManager: BlacklistManager;

		public ticketHandler: TicketHandler;
		public permissionHandler: PermissionHandler;
		public loggingHandler: LoggingHandler;
		public giveawaysManager: GiveawaysManager;

		public requests: Collection<string, number>;
		public loggers: Collection<string, Logger>;
		public multipliers: Collection<string, number>;
		public ApiCache: Collection<string, any>;

		public isOwner(id: string): boolean;
	}

	interface Preconditions {
		OwnerOnly: never;
		Blacklisted: never;
		PremiumOnly: never;

		// staff preconditions
		CetOnly: never;
		TrialModeratorOnly: never;
		ModeratorOnly: never;
		ManagerOnly: never;
		SeniorOnly: never;
	}
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		export interface Request {
			auth: AuthCookie | null;
		}
	}
}
