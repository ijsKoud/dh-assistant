import {
	Args,
	ArgumentError,
	CommandErrorPayload,
	Events,
	Listener,
	ListenerOptions,
	UserError,
} from "@sapphire/framework";
import { DiscordAPIError, HTTPError, Message } from "discord.js";
import { Command } from "../../../client/structures/Command";
import { RESTJSONErrorCodes } from "discord-api-types/v9";
import { ApplyOptions } from "@sapphire/decorators";
import { codeBlock } from "@sapphire/utilities";

const ignoredCodes = [RESTJSONErrorCodes.UnknownChannel, RESTJSONErrorCodes.UnknownMessage];

@ApplyOptions<ListenerOptions>({ once: false, event: "commandError" })
export class UserListener extends Listener {
	public async run(error: Error, { message, piece, args }: CommandErrorPayload) {
		const errorEmoji = this.container.client.constants.emojis.error;

		// If string || UserError, send to user
		if (typeof error === "string") return message.reply(`>>> ${errorEmoji} | ${error}`);
		if (error instanceof ArgumentError)
			return message.reply(`>>> ${errorEmoji} | ${error.message}`);
		if (error instanceof UserError) return message.reply(`>>> ${errorEmoji} | ${error.message}`);

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const logger = this.container.client.loggers.get("bot")!;

		if (error.name === "AbortError" || error.message === "Internal Server Error") {
			logger.warn(
				`${this.getWarnError(message)} (${message.author.id}) | ${error.constructor.name} | ${
					error.message
				}`
			);

			return message.reply(
				`>>> ${errorEmoji} | Oh no, this doesn't look very good. Something caused the request to abort their mission, please try again.`
			);
		}

		// checks if error is DiscordAPIError || HTTPError
		if (error instanceof DiscordAPIError || error instanceof HTTPError) {
			if (this.isSilencedError(args, error)) return;
			this.container.client.emit("error", error);
		} else {
			logger.warn(
				`${this.getWarnError(message)} (${message.author.id}) | ${error.constructor.name} | ${
					error.message
				}`
			);
		}

		const command = piece as Command;
		logger.fatal(`[COMMAND] ${command.path}\n${error.stack || error.message}`);

		try {
			return message.reply(this.generateUnexpectedErrorMessage(args, error));
		} catch (err) {
			this.container.client.emit(Events.Error, err);
		}

		return undefined;
	}

	private isSilencedError(args: Args, error: DiscordAPIError | HTTPError) {
		return ignoredCodes.includes(error.code) || this.isDirectMessageReplyAfterBlock(args, error);
	}

	private isDirectMessageReplyAfterBlock(args: Args, error: DiscordAPIError | HTTPError) {
		if (error.code !== RESTJSONErrorCodes.CannotSendMessagesToThisUser) return false;
		if (args.message.guild !== null) return false;
		return error.path === `/channels/${args.message.channel.id}/messages`;
	}

	private generateUnexpectedErrorMessage(args: Args, error: Error) {
		if (this.container.client.owners.includes(args.message.author.id))
			return codeBlock("js", error.stack ?? error.message);

		return `>>> ${this.container.client.constants.emojis.error} | Oh no, this doesn't look very good.\n**Error**: \`${error.message}\`\nIf this keeps happening, please DM the developer of this bot.`;
	}

	private getWarnError(message: Message) {
		return `ERROR: /${
			message.guild ? `${message.guild.id}/${message.channel.id}` : `DM/${message.author.id}`
		}/${message.id}`;
	}
}
