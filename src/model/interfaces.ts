export const strings = {
	required: { required: true, type: String },
	optional: { required: false, type: String },
};

export const numbers = {
	required: { required: true, type: Number },
	optional: { required: false, type: Number },
};

export interface iWarn {
	guildId: string;
	caseId: string;
	moderator: string;
	userId: string;
	date: number;
	reason: string;
}

export interface iLevel {
	userId: string;
	guildId: string;
	level: number;
	xp: number;
	colour?: string;
}

export interface iTicket {
	messageId?: string;
	channelId?: string;
	claimerId?: string;
	userId: string;
	status: "open" | "closed" | "unclaimed";
}
