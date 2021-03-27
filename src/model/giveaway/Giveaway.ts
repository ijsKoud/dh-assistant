import { strings, numbers } from "../interfaces";
import { Schema, Document, model } from "mongoose";

interface iGiveaway extends Document {
	requiredRole?: string;
	channelId: string;
	guildId: string;
	messageId: string;
	date: number;
	winners: number;
}

export default model<iGiveaway>(
	"giveaway",
	new Schema({
		requiredRole: strings.optional,
		channelId: strings.required,
		guildId: strings.required,
		messageId: strings.required,
		date: numbers.required,
		winners: numbers.required,
	})
);
