import { model, Schema } from "mongoose";

const reqString = { type: String, required: true };
const schema = new Schema({
	userId: reqString,
	channelId: reqString,
	claimerId: reqString,
});

const ticket = model("ticket", schema);
export default ticket;
