import { Schema, model, Document } from "mongoose";
import { strings } from "../interfaces";

interface iBlacklist extends Document {
	userId: string;
}

export default model<iBlacklist>(
	"blacklist",
	new Schema({
		userId: strings.required,
	})
);
