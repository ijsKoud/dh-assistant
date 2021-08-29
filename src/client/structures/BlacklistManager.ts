import Client from "../Client";

export default class BlacklistManager {
	public blacklisted: string[] = [];

	constructor(public client: Client) {}

	public isBlacklisted(userId: string, guildId = ""): boolean {
		return this.blacklisted.includes(userId) || this.blacklisted.includes(guildId);
	}

	public async blacklist(id: string): Promise<void> {
		if (this.blacklisted.includes(id)) return;
		this.blacklisted.push(id);
		await this.client.prisma.botBlacklist.create({ data: { id } });
	}

	public async whitelist(id: string): Promise<void> {
		if (!this.blacklisted.includes(id)) return;
		this.blacklisted = this.blacklisted.filter((x) => x !== id);
		await this.client.prisma.botBlacklist.delete({ where: { id } });
	}

	public setBlacklisted(blacklisted: string[]): this {
		this.blacklisted = blacklisted;

		return this;
	}
}
