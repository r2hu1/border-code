import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, Content, PhrasingContent } from "mdast";
import { TextAttributes } from "@opentui/core";
import { useTheme } from "../../providers/theme";

type Colors = ReturnType<typeof useTheme>["colors"];

function flattenInline(node: any): string {
	switch (node.type) {
		case "text":
			return node.value;
		case "inlineCode":
			return `\`${node.value}\``;
		case "strong":
			return node.children.map(flattenInline).join("");
		case "emphasis":
			return node.children.map(flattenInline).join("");
		case "delete":
			return node.children.map(flattenInline).join("");
		case "link":
			return `${node.children.map(flattenInline).join("")} (${node.url})`;
		case "image":
			return `[image: ${node.alt ?? node.url}]`;
		case "html":
			return node.value;
		case "break":
			return "\n";
		default:
			if ("children" in node) return node.children.map(flattenInline).join("");
			return "";
	}
}

function getInlineAttributes(node: any): number {
	if (node.type === "strong") return TextAttributes.BOLD;
	if (node.type === "emphasis") return TextAttributes.ITALIC;
	return 0;
}

function renderInlineChildren(
	nodes: PhrasingContent[],
	key: string,
	colors: Colors,
): React.ReactNode {
	return nodes.map((child, i) => {
		const text = flattenInline(child);
		const attrs = getInlineAttributes(child);
		if (attrs) {
			return (
				<text key={`${key}-inline-${i}`} attributes={attrs}>
					{text}
				</text>
			);
		}
		return text;
	});
}

function renderListItem(
	item: any,
	index: number,
	ordered: boolean,
	depth: number,
	key: string,
	colors: Colors,
): React.ReactNode {
	const indent = "  ".repeat(depth);
	const bullet = ordered ? `${index + 1}.` : "•";

	return (
		<box key={key} flexDirection="column">
			{item.children.map((child: any, ci: number) => {
				if (child.type === "paragraph") {
					return (
						<text key={`${key}-p-${ci}`}>
							{indent}
							{bullet} {flattenInline({ type: "root", children: child.children })}
						</text>
					);
				}
				if (child.type === "list") {
					return (
						<box key={`${key}-nested-${ci}`} flexDirection="column">
							{child.children.map((nestedItem: any, ni: number) =>
								renderListItem(
									nestedItem,
									ni,
									child.ordered ?? false,
									depth + 1,
									`${key}-nested-${ci}-${ni}`,
									colors,
								),
							)}
						</box>
					);
				}
				if (child.type === "code") {
					return renderNode(child, `${key}-code-${ci}`, colors);
				}
				return null;
			})}
		</box>
	);
}

function renderTableRow(row: any, isHead: boolean, colors: Colors, key: string): React.ReactNode {
	const cells: string[] = row.children.map((cell: any) =>
		flattenInline({ type: "root", children: cell.children }),
	);
	const widths = cells.map((c) => Math.max(c.length, 3));
	const padded = cells.map((c, i) => c.padEnd(widths[i] ?? 3));
	const line = "│ " + padded.join(" │ ") + " │";

	return (
		<text
			key={key}
			attributes={isHead ? TextAttributes.BOLD : 0}
		>
			{line}
		</text>
	);
}

function renderNode(node: Content, key: string, colors: Colors): React.ReactNode {
	switch (node.type) {
		case "heading": {
			const prefix = "#".repeat(node.depth) + " ";
			const level = node.depth;
			const attrs =
				level === 1
					? TextAttributes.BOLD
					: level === 2
						? TextAttributes.BOLD
						: TextAttributes.BOLD;
			return (
				<box key={key} flexDirection="column">
					<text attributes={attrs}>
						{prefix + flattenInline({ type: "root", children: node.children })}
					</text>
					{level <= 2 ? (
						<text>
							{"─".repeat(40)}
						</text>
					) : null}
				</box>
			);
		}

		case "paragraph":
			return (
				<text key={key}>
					{flattenInline({ type: "root", children: node.children })}
				</text>
			);

		case "code":
			return (
				<box key={key} flexDirection="column" paddingX={1}>
					{node.lang ? (
						<text attributes={TextAttributes.DIM}>
							{"┌─ " + node.lang}
						</text>
					) : (
						<text attributes={TextAttributes.DIM}>
							{"┌─"}
						</text>
					)}
					{node.value.split("\n").map((line, i) => (
						<text key={i} fg={colors.thinking}>
							{"│ " + line}
						</text>
					))}
					<text attributes={TextAttributes.DIM}>
						{"└─"}
					</text>
				</box>
			);

		case "blockquote":
			return (
				<box key={key} flexDirection="column">
					{(node.children as Content[]).map((child, i) => (
						<box key={`${key}-${i}`} flexDirection="row" gap={1}>
							<text>{"▌"}</text>
							<text fg={colors.thinking} attributes={TextAttributes.ITALIC}>
								{child.type === "paragraph"
									? flattenInline({ type: "root", children: (child as any).children })
									: ""}
							</text>
						</box>
					))}
				</box>
			);

		case "list":
			return (
				<box key={key} flexDirection="column">
					{(node.children as any[]).map((item, i) =>
						renderListItem(item, i, node.ordered ?? false, 0, `${key}-item-${i}`, colors),
					)}
				</box>
			);

		case "table": {
			const [head, ...rows] = node.children as any[];
			const divider = "├" + "─".repeat(38) + "┤";
			return (
				<box key={key} flexDirection="column">
					<text>{"┌" + "─".repeat(38) + "┐"}</text>
					{renderTableRow(head, true, colors, `${key}-head`)}
					<text>{divider}</text>
					{rows.map((row, i) =>
						renderTableRow(row, false, colors, `${key}-row-${i}`),
					)}
					<text>{"└" + "─".repeat(38) + "┘"}</text>
				</box>
			);
		}

		case "thematicBreak":
			return (
				<text key={key}>
					{"─".repeat(60)}
				</text>
			);

		case "html":
			return (
				<text key={key} attributes={TextAttributes.DIM}>
					{node.value}
				</text>
			);

		case "definition":
		case "footnoteDefinition":
			return null;

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
