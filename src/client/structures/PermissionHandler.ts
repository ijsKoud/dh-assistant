import { GuildMember } from "discord.js";
import Client from "../Client";

export default class PermissionHandler {
	constructor(public client: Client) {}

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

		if (options?.staff)
			roles.push(...[data.cet, data.trial, data.moderator, data.manager, data.senior]);
		if (options?.contentCreator) roles.push(...data.contentCreator);

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
