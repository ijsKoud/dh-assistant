import type { GuildMember } from "discord.js";
import type Client from "../../Client";
import type { Roles } from "../../types";

export class PermissionHandler {
	private roles: Roles;

	public constructor(public client: Client) {
		this.roles = client.constants.roles;
	}

	public isHigher(mod: GuildMember, offender: GuildMember): string {
		if (offender.roles.highest.position >= mod.roles.highest.position && !this.client.isOwner(mod.id)) return "mod-low";
		if (offender.guild.ownerId === offender.id) return "owner";
		if (offender.id === this.client.user?.id) return "bot";
		if (offender.roles.highest.position >= (offender.guild.me?.roles.highest.position ?? 0)) return "bot-low";

		return "";
	}

	public hasStaff(member: GuildMember): boolean {
		const roles = [this.roles.cet, this.roles.trial, this.roles.moderator, this.roles.manager, this.roles.senior];

		return this._parse(roles, member);
	}

	public hasCet(member: GuildMember): boolean {
		const roles = [this.roles.cet, this.roles.manager, this.roles.senior];

		return this._parse(roles, member);
	}

	public hasTrial(member: GuildMember): boolean {
		const roles = [this.roles.trial, this.roles.moderator, this.roles.manager, this.roles.senior];

		return this._parse(roles, member);
	}

	public hasMod(member: GuildMember): boolean {
		const roles = [this.roles.moderator, this.roles.manager, this.roles.senior];

		return this._parse(roles, member);
	}

	public hasManager(member: GuildMember): boolean {
		const roles = [this.roles.manager, this.roles.senior];

		return this._parse(roles, member);
	}

	public hasSenior(member: GuildMember): boolean {
		const roles = [this.roles.senior];

		return this._parse(roles, member);
	}

	public hasPremium(member: GuildMember, options?: { staff?: boolean; contentCreator?: boolean }): boolean {
		const roles = [
			this.roles.boost,
			this.roles.youtubeMember,
			...Object.keys(this.roles.levels).map((k) => (this.roles.levels as Record<string, string>)[k])
		];

		if (options?.contentCreator) roles.push(...this.roles.contentCreator);
		if (options?.staff) return this.hasStaff(member) || this._parse(roles, member);

		return this._parse(roles, member);
	}

	public getRank(member: GuildMember) {
		if (this.hasTrial(member)) return 1;
		if (this.hasMod(member)) return 2;
		if (this.hasCet(member)) return 3;
		if (this.hasManager(member)) return 4;
		if (this.hasSenior(member)) return 5;
		if (member.guild.ownerId === member.id) return 6;

		return 0;
	}

	protected _parse(roles: string[], member: GuildMember): boolean {
		return (
			member.roles.cache.some((r) => roles.includes(r.id)) || this.client.isOwner(member.id) || member.permissions.has("ADMINISTRATOR", true)
		);
	}
}
