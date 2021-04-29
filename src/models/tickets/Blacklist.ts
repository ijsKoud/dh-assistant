import { model, Schema, Document } from "mongoose";
import { strings } from "../interfaces";

interface iBlacklist extends Document {
	guildId: string;
	userId: string;
}

export default model<iBlacklist>(
	"blacklist",
	new Schema({
		guildId: strings.required,
		userId: strings.required,
	})
);
