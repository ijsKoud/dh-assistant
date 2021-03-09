import { strings } from "../interfaces";
import { Schema, Document, model } from "mongoose";

interface iBlacklist extends Document {
	userId: string;
}

export default model<iBlacklist>(
	"botBlacklist",
	new Schema({
		userId: strings.required,
	})
);
