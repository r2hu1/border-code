import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, Content } from "mdast";
import { TextAttributes } from "@opentui/core";
import { useTheme } from "../../providers/theme";

function flatten(node: any): string {
	if (node.type === "text") return node.value;
	if (node.type === "inlineCode") return `\`${node.value}\``;
	if (node.type === "strong") return node.children.map(flatten).join("");
	if (node.type === "emphasis") return node.children.map(flatten).join("");
	if (node.type === "link") return node.children.map(flatten).join("");
	if (!("children" in node)) return "";
	return node.children.map(flatten).join("");
}

function renderNode(node: Content, key: string, colors: any): React.ReactNode {
	switch (node.type) {
		case "heading": {
			const prefix = "#".repeat(node.depth) + " ";
			return (
				<text key={key} attributes={TextAttributes.BOLD} fg={colors.text}>
					{prefix + flatten(node)}
				</text>
			);
		}
		case "paragraph":
			return (
				<text key={key} fg={colors.text}>
					{flatten(node)}
				</text>
			);
		case "code":
			return (
				<box key={key} flexDirection="column" paddingX={1} marginY={0}>
					{node.lang ? (
						<text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
							{node.lang}
						</text>
					) : null}
					{node.value.split("\n").map((line, i) => (
						<text key={i} fg={colors.thinking}>
							{line}
						</text>
					))}
				</box>
			);
		case "blockquote":
			return (
				<box key={key} flexDirection="column" paddingLeft={2}>
					{(node as any).children.map((child: Content, i: number) =>
						renderNode(child, `${key}-${i}`, colors),
					)}
				</box>
			);
		case "list":
			return (
				<box key={key} flexDirection="column">
					{(node as any).children.map((item: any, i: number) => (
						<box key={i} flexDirection="column">
							<text fg={colors.text}>
								{(node as any).ordered ? `${i + 1}. ` : "• "}
								{flatten(item)}
							</text>
							{item.children
								?.filter((c: any) => c.type === "list")
								.map((nested: any, ni: number) =>
									renderNode(nested, `${key}-${i}-nested-${ni}`, colors),
								)}
						</box>
					))}
				</box>
			);
		case "thematicBreak":
			return (
				<text key={key} fg={colors.dimSeparator}>
					{"─".repeat(60)}
				</text>
			);
		case "table": {
			const [head, ...rows] = (node as any).children;
			return (
				<box key={key} flexDirection="column">
					<text fg={colors.text} attributes={TextAttributes.BOLD}>
						{head.children.map((cell: any) => flatten(cell)).join(" │ ")}
					</text>
					<text fg={colors.dimSeparator}>{"─".repeat(40)}</text>
					{rows.map((row: any, i: number) => (
						<text key={i} fg={colors.text}>
							{row.children.map((cell: any) => flatten(cell)).join(" │ ")}
						</text>
					))}
				</box>
			);
		}
		default:
			return null;
	}
}

export function Markdown({ content }: { content: string }) {
	const { colors } = useTheme();
	const tree = useMemo(
		() => unified().use(remarkParse).use(remarkGfm).parse(content) as Root,
		[content],
	);
	return (
		<box flexDirection="column" width="100%" gap={1}>
			{tree.children.map((node, i) => renderNode(node, String(i), colors))}
		</box>
	);
}
