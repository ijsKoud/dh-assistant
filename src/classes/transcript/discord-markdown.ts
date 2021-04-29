// original code from https://github.com/brussell98/discord-markdown
// this is a ts compiled-ish version with personalised content

import highlight from "highlight.js";
import markdown from "simple-markdown";
import emojis from "./emojis.json";

interface State {
	inline: boolean;
	inQuote: boolean;
	inEmphasis: boolean;
	escapeHTML: boolean;
	discordCallback: {
		guildId: string;
		user: (data: { id: string; type: string }) => string;
		channel: (data: { id: string; type: string }) => string;
		role: (data: { id: string; type: string }) => string;
		everyone: (data: { id: string; type: string }) => string;
		here: (data: { id: string; type: string }) => string;
	};
}

class DiscordMD {
	public rules = {
		blockQuote: Object.assign({}, markdown.defaultRules.blockQuote, {
			match: (source: string, state: State, prevSource: string) =>
				!/^$|\n *$/.test(prevSource) || state.inQuote
					? null
					: /^( *>>> ([\s\S]*))|^( *> [^\n]*(\n *> [^\n]*)*\n?)/.exec(source),
			parse: (capture: string[], parse: Function, state: State) => {
				const all = capture[0];
				const isBlock = Boolean(/^ *>>> ?/.exec(all));
				const removeSyntaxRegex = isBlock ? /^ *>>> ?/ : /^ *> ?/gm;
				const content = all.replace(removeSyntaxRegex, "");

				return {
					content: parse(content, { ...state, inQuote: true }),
					type: "blockQuote",
				};
			},
		}),
		codeBlock: Object.assign({}, markdown.defaultRules.codeBlock, {
			match: markdown.inlineRegex(/^```(([a-z0-9-]+?)\n+)?\n*([^]+?)\n*```/i),
			parse: (capture: string[], parse: Function, state: State) => {
				return {
					lang: (capture[2] ?? "").trim(),
					content: capture[3] ?? "",
					inQuote: state.inQuote ?? false,
				};
			},
			html: (node: any, output: Function, state: State) => {
				let code: HighlightResult;
				if (node.lang && highlight.getLanguage(node.lang))
					code = highlight.highlight(node.content, { language: node.lang, ignoreIllegals: true });

				return this.htmlTag("div", code ? code.value : markdown.sanitizeText(node.content), {
					class: `pre pre--multiline ${code ? "language-" + code.language : "nohighlight"}`,
				});
			},
		}),
		newline: markdown.defaultRules.newline,
		escape: markdown.defaultRules.escape,
		autolink: Object.assign({}, markdown.defaultRules.autolink, {
			parse: (capture: string[]) => {
				return {
					content: [
						{
							type: "text",
							content: capture[1],
						},
					],
					target: capture[1],
				};
			},
			html: (node: any, output: Function, state: State) =>
				this.htmlTag("a", output(node.content, state), { href: markdown.sanitizeUrl(node.target) }),
		}),
		url: Object.assign({}, markdown.defaultRules.url, {
			parse: (capture: string[]) => {
				return {
					content: [
						{
							type: "text",
							content: capture[1],
						},
					],
					target: capture[1],
				};
			},
			html: (node: any, output: Function, state: State) =>
				this.htmlTag("a", output(node.content, state), { href: markdown.sanitizeUrl(node.target) }),
		}),
		em: Object.assign({}, markdown.defaultRules.em, {
			parse: function (capture: string[], parse: Function, state: State) {
				const parsed = markdown.defaultRules.em.parse(
					capture,
					// @ts-expect-error
					parse,
					Object.assign({}, state, { inEmphasis: true })
				);
				return state.inEmphasis ? parsed.content : parsed;
			},
		}),
		strong: markdown.defaultRules.strong,
		u: markdown.defaultRules.u,
		strike: Object.assign({}, markdown.defaultRules.del, {
			match: markdown.inlineRegex(/^~~([\s\S]+?)~~(?!_)/),
		}),
		inlineCode: Object.assign({}, markdown.defaultRules.inlineCode, {
			match: (source: string) => markdown.defaultRules.inlineCode.match.regex.exec(source),
			html: (node: any, output: Function, state: State) =>
				this.htmlTag("span", markdown.sanitizeText(node.content.trim()), {
					class: "pre pre--inline",
				}),
		}),
		text: Object.assign({}, markdown.defaultRules.text, {
			match: (source: string) =>
				/^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff-]|\n\n|\n|\w+:\S|$)/.exec(source),
			html: (node: any, output: Function, state: State) =>
				state.escapeHTML ? markdown.sanitizeText(node.content) : node.content,
		}),
		emoticon: {
			order: markdown.defaultRules.text.order,
			match: (source: string) => /^(¯\\_\(ツ\)_\/¯)/.exec(source),
			parse: (capture: string[]) => {
				return {
					type: "text",
					content: capture[1],
				};
			},
			html: (node: any, output: Function, state: State) => output(node.content, state),
		},
		br: Object.assign({}, markdown.defaultRules.br, {
			match: markdown.anyScopeRegex(/^\n/),
		}),
		spoiler: {
			order: 0,
			match: (source: string) => /^\|\|([\s\S]+?)\|\|/.exec(source),
			parse: (capture: string[], parse: Function, state: State) => {
				return {
					content: parse(capture[1], state),
				};
			},
			html: (node: any, output: Function, state: State) =>
				this.htmlTag(
					"span",
					this.htmlTag("span", output(node.content, state), {
						class: "spoiler-text",
					}),
					{ class: "spoiler spoiler--hidden", onClick: "showSpoiler(event, this)" }
				),
		},
	};

	public discordCallbackDefaults = {
		user: ({ id }: { id: string }) => "@" + markdown.sanitizeText(id),
		channel: ({ id }: { id: string }) => "#" + markdown.sanitizeText(id),
		role: ({ id }: { id: string }) => "&" + markdown.sanitizeText(id),
		everyone: () => "@everyone",
		here: () => "@here",
	};

	public rulesDiscord = {
		discordUser: {
			order: markdown.defaultRules.strong.order,
			match: (source: string) => /^<@!?([0-9]*)>/.exec(source),
			parse: (capture: string[]) => {
				return {
					id: capture[1],
				};
			},
			html: (node: any, output: Function, state: State) =>
				this.htmlTag("a", state.discordCallback.user(node), {
					class: "d-mention d-user",
					href: `https://discord.com/users/${node.id}`,
				}),
		},
		discordChannel: {
			order: markdown.defaultRules.strong.order,
			match: (source: string) => /^<#?([0-9]*)>/.exec(source),
			parse: (capture: string[]) => {
				return {
					id: capture[1],
				};
			},
			html: (node: any, output: Function, state: State) =>
				this.htmlTag("a", state.discordCallback.channel(node), {
					class: "d-mention d-channel",
					href: `https://discord.com/channels${
						state.discordCallback.guildId ? `/${state.discordCallback.guildId}` : ""
					}/${node.id}`,
				}),
		},
		discordRole: {
			order: markdown.defaultRules.strong.order,
			match: (source: string) => /^<@&([0-9]*)>/.exec(source),
			parse: (capture: string[]) => {
				return {
					id: capture[1],
				};
			},
			html: (node: any, output: Function, state: State) =>
				this.htmlTag("span", state.discordCallback.role(node), { class: "d-mention d-role" }),
		},
		defaultEmoji: {
			order: markdown.defaultRules.strong.order,
			match: (source: string) => /^:(\w+):/.exec(source),
			parse: (capture: string[]) => {
				return {
					name: capture[1],
				};
			},
			html: (node: any, output: Function, state: State) => emojis[node.name] || `:${node.name}:`,
		},
		discordEmoji: {
			order: markdown.defaultRules.strong.order,
			match: (source: string) => /^<(a?):(\w+):(\d+)>/.exec(source),
			parse: (capture: string[]) => {
				return {
					animated: capture[1] === "a",
					name: capture[2],
					id: capture[3],
				};
			},
			html: (node: any, output: Function, state: State) =>
				this.htmlTag(
					"img",
					"",
					{
						class: `emoji${node.animated ? " emoji-animated" : ""}`,
						src: `https://cdn.discordapp.com/emojis/${node.id}.${node.animated ? "gif" : "png"}`,
						alt: `:${node.name}:`,
					},
					false
				),
		},
		discordEveryone: {
			order: markdown.defaultRules.strong.order,
			match: (source: string) => /^@everyone/.exec(source),
			parse: () => {
				return {};
			},
			html: (node: any, output: Function, state: State) => {
				this.htmlTag("span", state.discordCallback.everyone(node), { class: "d-mention d-user" });
			},
		},
		discordHere: {
			order: markdown.defaultRules.strong.order,
			match: (source: string) => /^@here/.exec(source),
			parse: () => {
				return {};
			},
			html: (node: any, output: Function, state: State) =>
				this.htmlTag("span", state.discordCallback.here(node), { class: "d-mention d-user" }),
		},
	};

	public rulesDiscordOnly = Object.assign({}, this.rulesDiscord, {
		text: Object.assign({}, markdown.defaultRules.text, {
			match: (source: string) =>
				/^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff-]|\n\n|\n|\w+:\S|$)/.exec(source),
			html: (node: any, output: Function, state: State) =>
				state.escapeHTML ? markdown.sanitizeText(node.content) : node.content,
		}),
	});

	public parser = markdown.parserFor(this.rules);
	public htmlOutput = markdown.outputFor(this.rules, "html");
	public parserDiscord = markdown.parserFor(this.rulesDiscordOnly);
	public htmlOutputDiscord = markdown.outputFor(this.rulesDiscordOnly, "html");
	public parserEmbed: any;
	public htmlOutputEmbed: any;

	public rulesEmbed = Object.assign({}, this.rules, {
		link: markdown.defaultRules.link,
	});

	constructor() {
		this.rules = Object.assign(this.rules, this.rulesDiscord);
		this.rulesEmbed = Object.assign({}, this.rules, {
			link: markdown.defaultRules.link,
		});

		this.parser = markdown.parserFor(this.rules);
		this.htmlOutput = markdown.outputFor(this.rules, "html");

		this.parserEmbed = markdown.parserFor(this.rulesEmbed);
		this.htmlOutputEmbed = markdown.outputFor(this.rulesEmbed, "html");
	}

	public htmlTag(
		tagName: string,
		content?: string,
		attributes: { [x: string]: string } = {},
		isClosed: boolean = true
	) {
		let attributeString = "";
		for (const attr in attributes) {
			if (Object.prototype.hasOwnProperty.call(attributes, attr) && attributes[attr])
				attributeString += ` ${markdown.sanitizeText(attr)}="${markdown.sanitizeText(
					attributes[attr]
				)}"`;
		}

		const unclosedTag = `<${tagName}${attributeString}>`;
		if (isClosed) return unclosedTag + content + `</${tagName}>`;

		return unclosedTag;
	}

	public toHTML(source: string, options?: any) {
		options = Object.assign(
			{
				embed: false,
				guildId: "",
				escapeHTML: true,
				discordOnly: false,
				discordCallback: {},
			},
			options ?? {}
		);

		let _parser = this.parser;
		let _htmlOutput = this.htmlOutput;

		if (options.discordOnly) {
			_parser = this.parserDiscord;
			_htmlOutput = this.htmlOutputDiscord;
		} else if (options.embed) {
			_parser = this.parserEmbed;
			_htmlOutput = this.htmlOutputEmbed;
		}

		const state: State = {
			inline: true,
			inQuote: false,
			inEmphasis: false,
			escapeHTML: options.escapeHTML,
			discordCallback: Object.assign({}, this.discordCallbackDefaults, options.discordCallback),
		};

		return _htmlOutput(_parser(source, state), state);
	}
}

const MDClass = new DiscordMD();
export default MDClass;

// @ts-ignore
markdown.htmlTag = MDClass.htmlTag;
