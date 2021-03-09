import { strings, numbers } from "./../interfaces";
import { Schema, Document, model } from "mongoose";

interface iMute extends Document {
	guildId: string;
	userId: string;
	moderator: string;
	duration: number;
	date: number;
}

export default model<iMute>(
	"Ban",
	new Schema({
		guildId: strings.required,
		moderator: strings.required,
		userId: strings.required,
		duration: numbers.required,
		date: numbers.required,
	})
);
