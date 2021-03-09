import { strings, numbers } from "../interfaces";
import { Schema, Document, model } from "mongoose";

interface iLevel extends Document {
	userId: string;
	guildId: string;
	level: number;
	xp: number;
	colour?: string;
}

export default model<iLevel>(
	"level",
	new Schema({
		userId: strings.required,
		guildId: strings.required,
		level: numbers.required,
		xp: numbers.required,
		colour: strings.optional,
	})
);
