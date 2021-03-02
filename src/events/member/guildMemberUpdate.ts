import { Listener } from "discord-akairo";
import { GuildMember } from "discord.js";

export default class guildMemberUpdate extends Listener {
	constructor() {
		super("guildMemberUpdate", {
			emitter: "client",
			event: "guildMemberUpdate",
		});
	}

	async exec(oldMember: GuildMember, newMember: GuildMember) {
		if (newMember.partial) newMember = await newMember.fetch();
		if (oldMember.pending && !newMember.pending) newMember.roles.add("701782375834583338");
	}
}
