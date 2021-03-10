import { Schema, model } from "mongoose";
import { strings } from "../interfaces";

const feedback = model(
	"feedback",
	new Schema({
		message: strings.required,
		guildId: strings.required,
	})
);
export default feedback;
