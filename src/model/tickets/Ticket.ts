import { Schema, model, Document } from "mongoose";
import { strings } from "../interfaces";

interface iTicket extends Document {
	messageId?: string;
	channelId?: string;
	claimerId?: string;
	userId: string;
	status: "open" | "closed" | "unclaimed";
}

export default model<iTicket>(
	"ticket",
	new Schema({
		messageId: strings.optional,
		channelId: strings.optional,
		claimerId: strings.optional,
		userId: strings.required,
		status: strings.required,
	})
);
