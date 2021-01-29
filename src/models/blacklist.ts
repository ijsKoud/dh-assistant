import { Schema, model } from "mongoose";

const reqString = {
	type: String,
	required: true,
};

const blacklist = model(
	"blacklist",
	new Schema({
		userId: reqString,
		guildId: reqString,
	})
);
export default blacklist;
