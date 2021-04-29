import { model, Schema, Document } from "mongoose";
import { numbers, strings } from "../interfaces";

interface iWarn extends Document {
	guildId: string;
	userId: string;
	reason: string;
	date: number;
	moderator: string;
	caseId: string;
}

export default model<iWarn>(
	"warn",
	new Schema({
		caseId: strings.required,
		guildId: strings.required,
		userId: strings.required,
		reason: strings.required,
		date: numbers.required,
		moderator: strings.required,
	})
);
