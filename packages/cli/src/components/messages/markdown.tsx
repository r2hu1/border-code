import { marked } from "marked";
import type { Token, Tokens } from "marked";
import { TextAttributes } from "@opentui/core";
import { EmptyBorder } from "../border";
import { useTheme } from "../../providers/theme";

function flattenTokens(tokens: Token[]): string {
	let out = "";
	for (const tok of tokens) {
		switch (tok.type) {
			case "text":
			case "codespan":
			case "escape":
				out += (tok as Tokens.Text | Tokens.Codespan | Tokens.Escape).text;
				break;
			case "strong":
			case "em":
			case "del":
				out += flattenTokens((tok as Tokens.Strong | Tokens.Em | Tokens.Del).tokens);
				break;
			case "link":
				out += flattenTokens((tok as Tokens.Link).tokens);
				break;
			case "br":
				out += "\n";
				break;
		}
	}
	return out;
}

function isTokensArray(t: unknown): t is Token[] {
	return Array.isArray(t) && t.length > 0 && typeof (t[0] as Record<string, unknown>).type === "string";
}

export function Markdown({ content }: { content: string }) {
	const { colors } = useTheme();
	const tokens = marked.lexer(content);

	return (
		<box flexDirection="column" width="100%" gap={1}>
			{tokens.map((token, i) => {
				switch (token.type) {
					case "code": {
						const codeToken = token as Tokens.Code;
						return (
							<box
								key={i}
								flexDirection="column"
								width="100%"
								gap={0}
								border={["left"]}
								borderColor={colors.dimSeparator}
								customBorderChars={{
									...EmptyBorder,
									vertical: "┃",
								}}
							>
								<box paddingX={1} paddingY={0}>
									<text>{codeToken.text}</text>
								</box>
							</box>
						);
					}

					case "heading": {
						const headingToken = token as Tokens.Heading;
						return (
							<text key={i} attributes={TextAttributes.BOLD}>
								{flattenTokens(headingToken.tokens)}
							</text>
						);
					}

					case "paragraph": {
						const paraToken = token as Tokens.Paragraph;
						return (
							<text key={i}>{flattenTokens(paraToken.tokens)}</text>
						);
					}

					case "list": {
						const listToken = token as Tokens.List;
						return (
							<box key={i} flexDirection="column" width="100%" gap={0}>
								{listToken.items.map((item, j) => {
									const listItem = item as Tokens.ListItem;
									const text = isTokensArray(listItem.tokens)
										? flattenTokens(listItem.tokens)
										: listItem.text;
									return <text key={j}>  • {text}</text>;
								})}
							</box>
						);
					}

					case "blockquote": {
						const quoteToken = token as Tokens.Blockquote;
						if (!isTokensArray(quoteToken.tokens)) return null;
						return (
							<box
								key={i}
								flexDirection="column"
								width="100%"
								gap={0}
								border={["left"]}
								borderColor={colors.dimSeparator}
								customBorderChars={{
									...EmptyBorder,
									vertical: "┃",
								}}
							>
								{quoteToken.tokens.map((t, j) => {
									if (t.type === "paragraph") {
										const p = t as Tokens.Paragraph;
										return (
											<box key={j} paddingX={1}>
												<text>{flattenTokens(p.tokens)}</text>
											</box>
										);
									}
									return null;
								})}
							</box>
						);
					}

					case "hr": {
						return (
							<text key={i} fg={colors.dimSeparator}>
								{"─".repeat(48)}
							</text>
						);
					}

					default:
						return null;
				}
			})}
		</box>
	);
}
