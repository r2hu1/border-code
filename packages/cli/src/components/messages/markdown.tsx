import { marked, type Token, type Tokens } from "marked";
import { TextAttributes } from "@opentui/core";
import { EmptyBorder } from "../border";
import { useTheme } from "../../providers/theme";

type InlineSegment = { text: string; bold?: boolean; italic?: boolean; dim?: boolean };

function inlineSegments(tokens: Token[]): InlineSegment[] {
	const out: InlineSegment[] = [];
	for (const tok of tokens) {
		switch (tok.type) {
			case "strong": {
				const inner = inlineSegments((tok as Tokens.Strong).tokens ?? []);
				for (const s of inner) out.push({ ...s, bold: true });
				break;
			}
			case "em": {
				const inner = inlineSegments((tok as Tokens.Em).tokens ?? []);
				for (const s of inner) out.push({ ...s, italic: true });
				break;
			}
			case "del": {
				const inner = inlineSegments((tok as Tokens.Del).tokens ?? []);
				for (const s of inner) out.push({ ...s, dim: true });
				break;
			}
			case "codespan":
				out.push({ text: ` ${(tok as Tokens.Codespan).text} `, dim: true });
				break;
			case "link": {
				const inner = inlineSegments((tok as Tokens.Link).tokens ?? []);
				for (const s of inner) out.push({ ...s });
				break;
			}
			case "br":
				out.push({ text: "\n" });
				break;
			case "escape":
				out.push({ text: (tok as Tokens.Escape).text });
				break;
			case "text": {
				const t = tok as Tokens.Text;
				if (t.tokens) {
					out.push(...inlineSegments(t.tokens));
				} else {
					out.push({ text: t.text });
				}
				break;
			}
			default:
				if ("raw" in tok) out.push({ text: (tok as any).raw });
				break;
		}
	}
	return out;
}

function flatText(tokens: Token[]): string {
	return inlineSegments(tokens).map((s) => s.text).join("");
}

function listItemText(item: Tokens.ListItem): string {
	return item.tokens.map((tok) => {
		if (tok.type === "text") {
			const t = tok as Tokens.Text;
			return t.tokens ? flatText(t.tokens) : t.text;
		}
		if (tok.type === "paragraph") return flatText((tok as Tokens.Paragraph).tokens);
		return "";
	}).join("");
}

function InlineSegments({ tokens }: { tokens: Token[] }) {
	const { colors } = useTheme();
	const segments = inlineSegments(tokens);
	return (
		<box flexDirection="row" flexWrap="wrap" gap={0}>
			{segments.map((seg, i) => {
				let attrs = 0;
				if (seg.bold) attrs |= TextAttributes.BOLD;
				if (seg.italic) attrs |= TextAttributes.ITALIC;
				return (
					<text
						key={i}
						attributes={attrs || undefined}
						fg={seg.dim ? colors.dimSeparator : undefined}
					>
						{seg.text}
					</text>
				);
			})}
		</box>
	);
}

export function Markdown({ content }: { content: string }) {
	const { colors } = useTheme();
	const tokens = marked.lexer(content);

	return (
		<box flexDirection="column" width="100%" gap={1}>
			{tokens.map((token, i) => {
				switch (token.type) {
					case "heading": {
						const t = token as Tokens.Heading;
						return (
							<text key={i} attributes={TextAttributes.BOLD}>
								{flatText(t.tokens)}
							</text>
						);
					}
					case "paragraph": {
						const t = token as Tokens.Paragraph;
						return (
							<box key={i} flexDirection="column" width="100%" gap={0}>
								<InlineSegments tokens={t.tokens} />
							</box>
						);
					}
					case "code": {
						const t = token as Tokens.Code;
						return (
							<box
								key={i}
								flexDirection="column"
								width="100%"
								border={["left"]}
								borderColor={colors.dimSeparator}
								customBorderChars={{ ...EmptyBorder, vertical: "┃" }}
							>
								<box paddingX={1}>
									<text fg={colors.thinking}>{t.text}</text>
								</box>
							</box>
						);
					}
					case "blockquote": {
						const t = token as Tokens.Blockquote;
						return (
							<box
								key={i}
								flexDirection="column"
								width="100%"
								border={["left"]}
								borderColor={colors.dimSeparator}
								customBorderChars={{ ...EmptyBorder, vertical: "┃" }}
							>
								{t.tokens.map((inner, j) => {
									if (inner.type === "paragraph") {
										return (
											<box key={j} paddingX={1}>
												<InlineSegments tokens={(inner as Tokens.Paragraph).tokens} />
											</box>
										);
									}
									return null;
								})}
							</box>
						);
					}
					case "list": {
						const t = token as Tokens.List;
						return (
							<box key={i} flexDirection="column" width="100%" gap={0}>
								{t.items.map((item, j) => {
									const bullet = t.ordered ? `${j + 1}.` : "•";
									const checkbox = item.task
										? (item.checked ? "✓ " : "☐ ")
										: "";
									return (
										<text key={j} fg={colors.dimSeparator}>
											{"  "}{bullet}{" "}{checkbox}{listItemText(item)}
										</text>
									);
								})}
							</box>
						);
					}
					case "hr":
						return (
							<text key={i} fg={colors.dimSeparator}>
								{"─".repeat(48)}
							</text>
						);
					case "space":
						return null;
					default:
						return null;
				}
			})}
		</box>
	);
}
