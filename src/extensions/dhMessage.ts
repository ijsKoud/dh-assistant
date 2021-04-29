import { Structures } from "discord.js";

export default Structures.extend(
	"Message",
	(message) =>
		class dhMessage extends message {
			public get prefix(): string {
				return process.env.PREFIX;
			}
		}
);
