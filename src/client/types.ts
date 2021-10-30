export interface Constants {
	channels: Channels;
	emojis: Emojis;
	roles: Roles;
}

export interface Channels {
	uwu: string[];
	adrequest: string;
	adchannel: string;
	pingrequest: string;
	cetChannel: string;
	eventsChannel: string;
}

export interface Emojis {
	error: string;
	redcross: string;
	greentick: string;
	loading: string;
	transfer: string;
}

export interface Roles {
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
