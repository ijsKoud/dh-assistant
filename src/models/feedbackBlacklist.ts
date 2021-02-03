import { Schema, model } from "mongoose";

const reqString = {
	type: String,
	required: true,
};

const feedbackBlacklist = model(
	"feedbackBlacklist",
	new Schema({
		userId: reqString,
		guildId: reqString,
	})
);
export default feedbackBlacklist;
