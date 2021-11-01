import { ListenerOptions, Listener } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { GuildMember } from "discord.js";

@ApplyOptions<ListenerOptions>({ once: false, event: "guildMemberUpdate" })
export class GuildMemberUpdateListener extends Listener {
	public async run(oldMember: GuildMember, newMember: GuildMember) {
		const { client } = this.container;
		if (oldMember.guild.id !== client.constants.guild) return;

		if (newMember.partial) newMember = await newMember.fetch();
		if (oldMember.pending && !newMember.pending) await newMember.roles.add(client.constants.roles.default).catch(() => void 0);
	}
}
