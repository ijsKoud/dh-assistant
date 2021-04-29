import { model, Schema, Document } from "mongoose";
import { strings } from "../interfaces";

interface iConfig extends Document {
	guildId: string;
	messageLogging?: string;
	modLogging?: string;
}

export default model<iConfig>(
	"config",
	new Schema({
		guildId: strings.required,
		messageLogging: strings.optional,
		modLogging: strings.optional,
	})
);
