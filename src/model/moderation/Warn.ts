import { strings, numbers } from "./../interfaces";
import { Schema, Document, model } from "mongoose";

interface iWarn extends Document {
	guildId: string;
	caseId: string;
	moderator: string;
	reason: string;
	userId: string;
	date: number;
}

export default model<iWarn>(
	"warn",
	new Schema({
		guildId: strings.required,
		caseId: strings.required,
		moderator: strings.required,
		userId: strings.required,
		date: numbers.required,
		reason: strings.required,
	})
);
