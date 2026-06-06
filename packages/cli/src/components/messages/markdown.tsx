import { marked } from "marked";
import { TextAttributes } from "@opentui/core";
import { EmptyBorder } from "../border";
import { useTheme } from "../../providers/theme";

function flattenTokens(tokens: marked.Token[]): string {
	let out = "";
	for (const tok of tokens) {
		switch (tok.type) {
			case "text":
			case "codespan":
				out += "text" in tok ? tok.text : "";
				break;
			case "strong":
			case "em":
			case "del":
				out += flattenTokens(tok.tokens);
				break;
			case "link":
				out += flattenTokens(tok.tokens);
				break;
			case "br":
				out += "\n";
				break;
		}
	}
	return out;
}

export function Markdown({ content }: { content: string }) {
	const { colors } = useTheme();
	const tokens = marked.lexer(content);

	return (
		<box flexDirection="column" width="100%" gap={1}>
			{tokens.map((token, i) => {
				switch (token.type) {
					case "code": {
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
									<text>{token.text}</text>
								</box>
							</box>
						);
					}

					case "heading": {
						return (
							<text key={i} attributes={TextAttributes.BOLD}>
								{flattenTokens(token.tokens)}
							</text>
						);
					}

					case "paragraph": {
						return (
							<text key={i}>{flattenTokens(token.tokens)}</text>
						);
					}

					case "list": {
						return (
							<box key={i} flexDirection="column" width="100%" gap={0}>
								{token.items.map((item, j) => (
									<text key={j}>  • {flattenTokens(item.tokens)}</text>
								))}
							</box>
						);
					}

					case "blockquote": {
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
								{token.tokens.map((t, j) => {
									if (t.type === "paragraph") {
										return (
											<box key={j} paddingX={1}>
												<text>{flattenTokens(t.tokens)}</text>
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
							<text key={i} color={colors.dimSeparator}>
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
