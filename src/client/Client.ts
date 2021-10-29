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

export default class Client extends SapphireClient {
	public owners: string[];

	public isOwner(id: string): boolean {
		return this.owners.includes(id);
	}

	public constants: Constants = JSON.parse(
		readFileSync(join(process.cwd(), "config", "constants.json"), {
			encoding: "utf-8",
		})
	);
	public prisma = new PrismaClient();
	public utils = new Utils(this);

	public automod = new Automod(this);

	// @ts-ignore
	public giveawaysManager = new GiveawaysManager(this, {
		storage: join(process.cwd(), "data", "giveaways.json"),
		default: {
			botsCanWin: false,
			embedColor: "#37625d",
		},
	});
	public levelManager = new LevelManager(this);
	public blacklistManager = new BlacklistManager(this);

	public ticketHandler = new TicketHandler(this);
	public permissionHandler = new PermissionHandler(this);
	public loggingHandler = new LoggingHandler(this);

	public requests = new Collection<string, number>();
	public loggers = new Collection<string, Logger>();
	public multipliers = new Collection<string, number>();

	constructor(options: ClientOptions) {
		super({
			intents: options.intents,
			allowedMentions: { users: [], repliedUser: false, roles: [] },
			baseUserDirectory: join(__dirname, "..", "bot"),
			defaultPrefix: process.env.PREFIX,
			partials: options.partials,
			loadDefaultErrorListeners: false,
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

	private handleRejection(reason: unknown) {
		this.loggers.get("bot")?.error("Unhandled rejection: ", reason);
	}

	public async start(): Promise<void> {
		await this.prisma.$connect();
		this.loggers.get("db")?.info("Successfully connected to postgreSQL Database via Prisma!");

		const blacklisted = await this.prisma.botBlacklist.findMany();
		this.blacklistManager.setBlacklisted(blacklisted.map((b) => b.id));

		await this.login(process.env.TOKEN);
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
		owners: string[];
		isOwner(id: string): boolean;

		constants: Constants;
		prisma: PrismaClient;
		utils: Utils;

		automod: Automod;

		levelManager: LevelManager;
		blacklistManager: BlacklistManager;

		ticketHandler: TicketHandler;
		permissionHandler: PermissionHandler;
		loggingHandler: LoggingHandler;
		giveawaysManager: GiveawaysManager;

		requests: Collection<string, number>;
		loggers: Collection<string, Logger>;
		multipliers: Collection<string, number>;
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
