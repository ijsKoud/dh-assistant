import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Interaction } from "discord.js";

@ApplyOptions<ListenerOptions>({ event: "interactionCreate" })
export default class InteractionCreateListener extends Listener {
	public async run(interaction: Interaction) {
		if (interaction.inGuild() && interaction.isButton())
			this.container.client.ticketHandler.handleInteraction(interaction);
	}
}
