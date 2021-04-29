import { model, Schema, Document } from "mongoose";
import { strings } from "../interfaces";

interface iTicketConfig extends Document {
	guildId: string;
	enabled: boolean;
	channelId?: string;
	transcripts: { enabled: boolean; channelId?: string };
	roleId?: string;
	category?: string;
}

export default model<iTicketConfig>(
	"ticketConfig",
	new Schema({
		enabled: { type: Boolean, required: true, default: false },
		guildId: strings.required,
		channelId: strings.optional,
		roleId: strings.optional,
		category: strings.optional,
		transcripts: { type: Object, required: true, default: { enabled: false, channelId: "" } },
	})
);
