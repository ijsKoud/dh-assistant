import { Schema, model, Document } from "mongoose";
import { strings } from "../interfaces";

interface iFeedback extends Document {
	message: string;
	guildId: string;
}

const feedback = model<iFeedback>(
	"feedback",
	new Schema({
		message: strings.required,
		guildId: strings.required,
	})
);
export default feedback;
