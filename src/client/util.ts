import osloClient from "./client";

export default class util {
	public constructor(private client: osloClient) {}
	public emojiFinder(name: string): string {
		return (
			this.client.guilds.cache
				.get("746536046275198997")
				.emojis.cache.find((e) => e.name === name)
				?.toString() || "emoji"
		);
	}
}
