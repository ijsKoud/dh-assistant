import type { Level } from ".prisma/client";

export interface Constants {
	channels: Channels;
	emojis: Emojis;
	roles: Roles;
	guild: string;
}

export interface Channels {
	uwu: string[];
	adrequest: string;
	adchannel: string;
	pingrequest: string;
	cetChannel: string;
	eventsChannel: string;
	qotdChannel: string;
	general: string;
}

export interface Emojis {
	error: string;
	redcross: string;
	greentick: string;
	loading: string;
	transfer: string;
}

export interface Roles {
	default: string;
	cet: string;
	trial: string;
	moderator: string;
	manager: string;
	senior: string;
	boost: string;
	youtubeMember: string;
	contentCreator: string;
	levels: { [key: string]: string };
}

export interface ApiSettings {
	port: number;
	secret: string;
	channels: string[];
}

export interface User {
	id: string;
	tag: string;
	username: string;
	discriminator: string;
	avatar: string;
	rank: -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export interface LeaderboardStat {
	level: Level & { tag: string | undefined };
	i: number;
}

export type ApiResponse = { message: string; error: string } | null;
