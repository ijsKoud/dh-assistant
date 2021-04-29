import { model, Schema, Document } from "mongoose";
import { strings } from "../interfaces";

interface iAutomod extends Document {
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

export default model<iAutomod>(
	"Automod",
	new Schema({
		guildId: strings.required,
		enabled: { type: Boolean, required: true, default: false },
		mutes: { type: Object, required: true, default: { role: "", warns: 2, duration: 6e5 } },
		caps: {
			type: Object,
			required: true,
			default: {
				whitelisted: [],
				enabled: false,
				action: "verbal",
			},
		},
		mention: {
			type: Object,
			required: true,
			default: {
				threshold: {
					messages: 7,
					seconds: 5,
				},
				action: "verbal",
				whitelisted: [],
				enabled: false,
			},
		},
		spam: {
			type: Object,
			required: true,
			default: {
				threshold: {
					messages: 7,
					seconds: 5,
				},
				action: "verbal",
				whitelisted: [],
				enabled: false,
			},
		},
		blacklisted: {
			type: Object,
			required: true,
			default: {
				words: {
					whitelisted: [],
					blacklisted: [],
				},
				action: "verbal",
				whitelisted: [],
			},
		},
	})
);
