import { Guild, GuildMember, Message } from "discord.js";

export interface ModerationSettings {
	mute: {
		role: string;
		duration: number;
	};
	logging: {
		message: string;
		mod: string;
		member: string;
		join: string;
		appeals: string;
	};
	globalWhitelisted: string[];
	thresholds: {
		caps: ThresholdsSetting;
		invite: ThresholdsSetting;
		spam: ThresholdsSetting;
		mention: ThresholdsSetting;
		badWords: BadWordsSettings;
	};
}

export interface BadWordsSettings {
	type: string;
	enabled: boolean;
	whitelisted: string[];
	message: string;
	reason: string;
	blacklistedWords: string[];
	whitelistedWords: string[];
}

export interface ThresholdsSetting {
	type: string;
	enabled: boolean;
	whitelisted: string[];
	message: string;
	reason: string;
	threshold: {
		value: number;
		duration: number;
	};
}

export interface CheckResults {
	message: string;
	reason: string;
	user: string;
	guild: string;
	type: string;
	date: number;
}

export type ModMessage = Message & { guild: Guild; guildId: string; member: GuildMember };
