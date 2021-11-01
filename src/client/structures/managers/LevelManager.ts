import type { Level } from ".prisma/client";
import type { GuildMember } from "discord.js";
import type Client from "../../../client/Client";

export class LevelManager {
	public lvlBlacklisted = ["710090914776743966", "701809203484033024"];
	public boost = 1;
	public img: Map<string, Buffer> = new Map();
	public cache: Map<string, boolean> = new Map();

	public constructor(public client: Client) {}

	public async createUser(user: string, guild: string): Promise<Level> {
		return this.client.prisma.level.create({
			data: { id: `${user}-${guild}`, level: 1, xp: 0 }
		});
	}

	public generateXP(xp = 0, multiplier = 1): number {
		return xp + (Math.floor(Math.random() * 16) + 4) * this.boost * multiplier;
	}

	public async updateUser(user: string, guild: string, data: Level): Promise<{ lvl: Level; lvlUp: boolean } | null> {
		const id = `${user}-${guild}`;
		let lvlUp = false;

		if (this.cache.has(id)) return null;

		this.cache.set(id, true);
		setTimeout(() => this.cache.delete(id), 6e4);

		let lvl = await this.client.prisma.level.findFirst({ where: { id } });
		if (!lvl) lvl = { xp: 0, level: 1, bg: 0, id };

		const required = lvl.level * 75;
		if (required - data.xp <= 0) {
			data.level = lvl.level + 1;
			data.xp -= required;
			lvlUp = true;
		}

		const updated = await this.client.prisma.level.update({ where: { id }, data });
		return { lvl: updated, lvlUp };
	}

	public async rankUser(user: GuildMember, { level }: Level) {
		const role: { old: string | null; new: string | null } = { old: null, new: null };
		switch (level) {
			case 5:
				role.new = "818231134445109329";
				break;
			case 10:
				role.new = "818231135325913158";
				role.old = "818231134445109329";
				break;
			case 20:
				role.new = "818231135992545320";
				role.old = "818231135325913158";
				break;
			case 30:
				role.new = "818231137687306271";
				role.old = "818231135992545320";
				break;
			case 40:
				role.new = "818231137691238470";
				role.old = "818231137687306271";
				break;
			case 50:
				role.new = "818233328984522814";
				role.old = "818231137691238470";
				break;
			case 60:
				role.new = "818233330414780426";
				role.old = "818233328984522814";
				break;
			default:
				break;
		}

		if (role.new) await user.roles.add(role.new).catch(() => void 0);
		if (role.old) await user.roles.remove(role.old).catch(() => void 0);
	}

	public async getLevels(id: string): Promise<{ level: Level; i: number }[]> {
		return Promise.all(
			(await this.client.prisma.level.findMany({ where: { id: { endsWith: id } } }))
				.map((level) => ({ level, total: this.getTotal(level.level, level.xp) }))
				.sort((a, b) => b.total - a.total)
				.map(async (l, i) => ({
					level: {
						...l.level,
						tag: (await this.client.utils.fetchUser(l.level.id.split("-")[0]))?.tag
					},
					i
				}))
		);
	}

	public getTotal(level: number, xp: number): number {
		const arr: number[] = [];
		for (let i = 1; i < level + 1; i++) arr.push(75 * i);

		return arr.reduce((a, b) => a + b) + xp;
	}
}
