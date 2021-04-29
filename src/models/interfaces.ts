export const strings = {
	required: { required: true, type: String },
	optional: { required: false, type: String },
};

export const numbers = {
	required: { required: true, type: Number },
	optional: { required: false, type: Number },
};

export interface iConfig {
	guildId: string;
	messageLogging?: string;
	modLogging?: string;
}

export interface iTicket {
	guildId: string;
	userId: string;
	caseId: string;
	channelId?: string;
	messageId?: string;
	claimerId?: string;
	status: "open" | "closed" | "unclaimed";
}

export interface iTicketConfig {
	guildId: string;
	enabled: boolean;
	channelId?: string;
	transcripts: { enabled: boolean; channelId?: string };
	roleId?: string;
	category?: string;
}

export interface iLogs {
	type: "ban" | "unban" | "kick" | "mute";
	guildId: string;
	userId: string;
	reason: string;
	startDate: number;
	endDate?: number;
	moderator: string;
}

export interface iWarn {
	guildId: string;
	userId: string;
	reason: string;
	date: number;
	moderator: string;
	caseId?: string;
}

export interface iMute {
	guildId: string;
	userId: string;
	reason: string;
	startDate: number;
	endDate: number;
	moderator: string;
}

export interface iAutomod {
	guildId: string;
	enabled: boolean;
	mutes: {
		role: string;
		warns: number;
		duration: number;
	};
	caps: {
		whitelisted: string[];
		enabled: boolean;
		action: "verbal" | "warn" | "mute";
	};
	mention: {
		threshold: {
			messages: number;
			seconds: number;
		};
		action: "verbal" | "warn" | "mute";
		whitelisted: string[];
		enabled: boolean;
	};
	spam: {
		threshold: {
			messages: number;
			seconds: number;
		};
		action: "verbal" | "warn" | "mute";
		whitelisted: string[];
		enabled: boolean;
	};
	blacklisted: {
		words: {
			whitelisted: string[];
			blacklisted: string[];
		};
		action: "verbal" | "warn" | "mute";
		whitelisted: string[];
	};
}

export interface iGiveaway {
	requiredRole?: string;
	channelId: string;
	guildId: string;
	messageId: string;
	date: number;
	winners: number;
}

export interface iLevel {
	userId: string;
	guildId: string;
	level: number;
	xp: number;
	colour?: string;
}
