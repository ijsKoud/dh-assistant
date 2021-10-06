import { GuildMember } from "discord.js";
import Client from "../../Client";
import { roles as ConstantRoles } from "../../constants";

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
		const roles = [
			ConstantRoles.cet,
			ConstantRoles.trial,
			ConstantRoles.moderator,
			ConstantRoles.manager,
			ConstantRoles.senior,
		];

		return this._parse(roles, member);
	}

	public hasCet(member: GuildMember): boolean {
		const roles = [ConstantRoles.cet, ConstantRoles.manager, ConstantRoles.senior];

		return this._parse(roles, member);
	}

	public hasTrial(member: GuildMember): boolean {
		const roles = [
			ConstantRoles.trial,
			ConstantRoles.moderator,
			ConstantRoles.manager,
			ConstantRoles.senior,
		];

		return this._parse(roles, member);
	}

	public hasMod(member: GuildMember): boolean {
		const roles = [ConstantRoles.moderator, ConstantRoles.manager, ConstantRoles.senior];

		return this._parse(roles, member);
	}

	public hasManager(member: GuildMember): boolean {
		const roles = [ConstantRoles.manager, ConstantRoles.senior];

		return this._parse(roles, member);
	}

	public hasSenior(member: GuildMember): boolean {
		const roles = [ConstantRoles.senior];

		return this._parse(roles, member);
	}

	public hasPremium(
		member: GuildMember,
		options?: { staff?: boolean; contentCreator?: boolean }
	): boolean {
		const roles = [
			ConstantRoles.boost,
			ConstantRoles.youtubeMember,
			...Object.keys(ConstantRoles.levels).map((k) => ConstantRoles.levels[k]),
		];

		if (options?.contentCreator) roles.push(...ConstantRoles.contentCreator);
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
