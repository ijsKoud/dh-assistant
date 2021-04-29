import { model, Schema, Document } from "mongoose";
import { numbers, strings } from "../interfaces";

interface iLogs extends Document {
	type: "ban" | "unban" | "kick" | "mute";
	guildId: string;
	userId: string;
	reason: string;
	startDate: number;
	endDate?: number;
	moderator: string;
}

export default model<iLogs>(
	"logs",
	new Schema({
		type: strings.required,
		guildId: strings.required,
		userId: strings.required,
		reason: strings.required,
		startDate: numbers.required,
		endDate: numbers.optional,
		moderator: strings.required,
	})
);
