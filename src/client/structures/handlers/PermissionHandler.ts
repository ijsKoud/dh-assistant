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

	public hasQotd(member: GuildMember): boolean {
		const roles = [this.roles.qotd, this.roles.manager, this.roles.senior];

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

		if (options?.contentCreator) roles.push(this.roles.contentCreator);
		if (options?.staff) roles.push(this.roles.cet, this.roles.trial, this.roles.moderator, this.roles.manager, this.roles.senior);

		return this._parse(roles, member);
	}

	public getRank(member: GuildMember) {
		if (this._parse([this.roles.cet], member, false)) return 1; // cet
		if (this._parse([this.roles.trial], member, false)) return 2; // trial
		if (this._parse([this.roles.moderator], member, false)) return 3; // mod
		if (this._parse([this.roles.manager], member, false)) return 4; // manager
		if (this._parse([this.roles.senior], member, false)) return 5; // senior
		if (member.guild.ownerId === member.id) return 6; // owner

		return 0;
	}

	protected _parse(roles: string[], member: GuildMember, admin = true): boolean {
		return (
			member.roles.cache.some((r) => roles.includes(r.id)) ||
			(admin && this.client.isOwner(member.id)) ||
			(admin && member.permissions.has("ADMINISTRATOR", true))
		);
	}
}
