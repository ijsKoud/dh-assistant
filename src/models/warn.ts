import { Schema, model } from "mongoose";

const reqString = {
	type: String,
	required: true,
};

const warn = model(
	"warn",
	new Schema({
		id: reqString,
		guildId: reqString,
		moderator: reqString,
		reason: reqString,
		case: reqString,
		date: { type: Number, required: true, default: Date.now() },
	})
);

export default warn;
