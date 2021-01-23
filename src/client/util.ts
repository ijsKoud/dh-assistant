import osloClient from "./client";

export default class util {
	public constructor(private client: osloClient) {}

	// public functions
	public emojiFinder(name: string): string {
		return (
			this.client.guilds.cache
				.get("746536046275198997")
				.emojis.cache.find((e) => e.name === name)
				?.toString() || "emoji"
		);
	}

	public formatPerms(perms: string[]): string {
		if (!Array.isArray(perms) || perms.length === 0) return "`―`";

		const formattedPerms = perms.map(
			(str) =>
				`\`${str
					.replace(/_/g, " ")
					.replace(/GUILD/g, "SERVER")
					.toLowerCase()
					.replace(/\b(\w)/g, (char) => char.toUpperCase())}\``
		);

		return formattedPerms.length > 1
			? `\`${formattedPerms.slice(0, -1).join("`, `")}\` and \`${formattedPerms.slice(-1)[0]}\``
			: `\`${formattedPerms[0]}\``;
	}
}
