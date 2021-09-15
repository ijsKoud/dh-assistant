import { GuildMember } from "discord.js";
import Client from "../../Client";

export class PermissionHandler {
	constructor(public client: Client) {}

	public isHigher(mod: GuildMember, offender: GuildMember): string {
		if (
			offender.roles.highest.position >= mod.roles.highest.position &&
			!this.client.isOwner(mod.id)
		)
			return "mod-low";
		if (offender.guild.ownerId === offender.id) return "owner";
		if (offender.id === this.client.user?.id) return "bot";
		if (offender.roles.highest.position >= (offender.guild.me?.roles.highest.position ?? 0))
			return "bot-low";

		return "";
	}

	public hasStaff(member: GuildMember): boolean {
		const data = this.client.constants.roles;
		const roles = [data.cet, data.trial, data.moderator, data.manager, data.senior];

		return this._parse(roles, member);
	}

	public hasCet(member: GuildMember): boolean {
		const data = this.client.constants.roles;
		const roles = [data.cet, data.manager, data.senior];

		return this._parse(roles, member);
	}

	public hasTrial(member: GuildMember): boolean {
		const data = this.client.constants.roles;
		const roles = [data.trial, data.moderator, data.manager, data.senior];

		return this._parse(roles, member);
	}

	public hasMod(member: GuildMember): boolean {
		const data = this.client.constants.roles;
		const roles = [data.moderator, data.manager, data.senior];

		return this._parse(roles, member);
	}

	public hasManager(member: GuildMember): boolean {
		const data = this.client.constants.roles;
		const roles = [data.manager, data.senior];

		return this._parse(roles, member);
	}

	public hasSenior(member: GuildMember): boolean {
		const data = this.client.constants.roles;
		const roles = [data.senior];

		return this._parse(roles, member);
	}

	public hasPremium(
		member: GuildMember,
		options?: { staff?: boolean; contentCreator?: boolean }
	): boolean {
		const data = this.client.constants.roles;
		const roles = [
			data.boost,
			data.youtubeMember,
			...Object.keys(data.levels).map((k) => data.levels[k]),
		];

		if (options?.contentCreator) roles.push(...data.contentCreator);
		if (options?.staff) return this.hasStaff(member) || this._parse(roles, member);

		return this._parse(roles, member);
	}

	protected _parse(roles: string[], member: GuildMember): boolean {
		return (
			member.roles.cache.some((r) => roles.includes(r.id)) ||
			this.client.isOwner(member.id) ||
			member.permissions.has("ADMINISTRATOR", true)
		);
	}
}
