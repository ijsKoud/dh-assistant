import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class roleCommand extends Command {
	public constructor() {
		super("role", {
			aliases: ["role"],
			clientPermissions: ["MANAGE_ROLES"],
			userPermissions: ["MANAGE_ROLES"],
			channel: "guild",
			cooldown: 1e3,
			description: {
				content: "Adds or removes a role from a user",
				usage: "role <user> <add/remove> <role>",
			},
			args: [
				{
					id: "userId",
					type: "string",
				},
				{
					id: "option",
					type: "lowercase",
				},
				{
					id: "roleId",
					type: "string",
				},
			],
		});
	}

	async exec(
		message: Message,
		{ userId, option, roleId }: { userId: string; option: string; roleId: string }
	) {
		const member = await this.client.utils.fetchMember(userId, message.guild);
		if (!member)
			return message.util.send(this.client.responses.missingArg("Invalid user provided"));
		if (!["add", "remove"].includes(option))
			return message.util.send(
				this.client.responses.missingArg("Invalid option provided, option must be add or remove.")
			);

		const role = await this.client.utils.getRole(roleId, message.guild);
		if (!role || role.managed || role.position >= message.guild.me.roles.highest.position)
			return message.util.send(
				this.client.responses.missingArg("Invalid role provided/unable to manage that role.")
			);

		if (
			member.roles.highest.position <= role.position ||
			(member.roles.highest.position >= message.member.roles.highest.position &&
				member.id !== message.guild.ownerID)
		)
			return message.util.send(
				this.client.responses.missingArg(
					"You are unable to add/remove the role due to role hierarchy."
				)
			);

		if (option === "add") await member.roles.add(role);
		else await member.roles.remove(role);

		await message.util.send(
			`>>> ${this.client.emoji.greentick} | Successfully ${
				option === "add" ? "gave" : "took away"
			} the **${role.name}** (${role.toString()}) role ${option === "add" ? "to" : "from"} **${
				member.user.tag
			}** (${member.toString()})`,
			{ allowedMentions: { roles: [], users: [] } }
		);
	}
}
