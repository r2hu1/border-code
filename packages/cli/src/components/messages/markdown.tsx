import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, Content, Parent } from "mdast";
import { TextAttributes } from "@opentui/core";

function renderNode(node: Content, key: string): React.ReactNode {
	switch (node.type) {
		case "heading":
			return (
				<text key={key} attributes={TextAttributes.BOLD}>
					{flatten(node)}
				</text>
			);

		case "paragraph":
			return (
				<text key={key}>
					{flatten(node)}
				</text>
			);

		case "code":
			return (
				<box
					key={key}
					flexDirection="column"
					paddingLeft={2}
				>
					{node.value.split("\n").map((line, i) => (
						<text key={i}>{line}</text>
					))}
				</box>
			);

		case "blockquote":
			return (
				<box
					key={key}
					flexDirection="column"
					paddingLeft={2}
				>
					{node.children.map((child, i) =>
						renderNode(child, `${key}-${i}`),
					)}
				</box>
			);

		case "list":
			return (
				<box
					key={key}
					flexDirection="column"
				>
					{node.children.map((item, i) => (
						<text key={i}>
							{node.ordered ? `${i + 1}. ` : "• "}
							{flatten(item)}
						</text>
					))}
				</box>
			);

		case "thematicBreak":
			return (
				<text key={key}>
					{"─".repeat(60)}
				</text>
			);

		default:
			return null;
	}
}

function flatten(node: any): string {
	if (node.type === "text") return node.value;

	if (node.type === "inlineCode") {
		return `\`${node.value}\``;
	}

	if (!("children" in node)) return "";

	return node.children.map(flatten).join("");
}

export function Markdown({ content }: { content: string }) {
	const tree = useMemo(() => {
		return unified()
			.use(remarkParse)
			.use(remarkGfm)
			.parse(content) as Root;
	}, [content]);

	return (
		<box
			flexDirection="column"
			width="100%"
			gap={1}
		>
			{tree.children.map((node, i) =>
				renderNode(node, String(i)),
			)}
		</box>
	);
}
