import { model, Schema, Document } from "mongoose";
import { strings } from "../interfaces";

interface iTicket extends Document {
	guildId: string;
	userId: string;
	caseId: string;
	channelId?: string;
	messageId?: string;
	claimerId?: string;
	status: "open" | "closed" | "unclaimed";
}

export default model<iTicket>(
	"ticket",
	new Schema({
		status: strings.required,
		guildId: strings.required,
		userId: strings.required,
		caseId: strings.required,
		channelId: strings.optional,
		messageId: strings.optional,
		claimerId: strings.optional,
	})
);
