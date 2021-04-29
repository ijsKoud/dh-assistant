import { model, Schema, Document } from "mongoose";
import { strings } from "../interfaces";

interface iBotBlacklist extends Document {
	userId?: string;
	guildId?: string;
}

export default model<iBotBlacklist>(
	"botblacklist",
	new Schema({
		userId: strings.optional,
		guildId: strings.optional,
	})
);
