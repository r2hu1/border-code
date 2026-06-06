import { TextAttributes } from "@opentui/core";
import { EmptyBorder } from "../border";
import { Loader } from "../loader";
import { useTheme } from "../../providers/theme";
import { Mode } from "@border-code/shared";
import type { Message } from "@border-code/core-api";
import { Markdown } from "./markdown";

type Props = {
	message: Message;
};

function isStreaming(message: Message): boolean {
	return !message.content && !message.reasoning && !message.toolCalls?.length;
}

function ReasoningBlock({ reasoning }: { reasoning: string }) {
	const { colors } = useTheme();

	return (
		<box
			flexDirection="column"
			width="100%"
			gap={0}
		>
			<box paddingX={1} paddingY={0}>
				<text fg={colors.thinking} attributes={TextAttributes.ITALIC}>
					{reasoning}
				</text>
			</box>
		</box>
	);
}

function summarizeResult(result: unknown): string {
	const text = typeof result === "string" ? result : JSON.stringify(result);
	const words = text.split(/\s+/).filter(Boolean);
	const preview = words.slice(0, 30).join(" ");
	return words.length > 30 ? preview + "..." : preview;
}

function ToolCalls({ message }: { message: Message }) {
	const { colors } = useTheme();

	if (!message.toolCalls) return null;

	return (
		<box flexDirection="column" width="100%" gap={0}>
			{message.toolCalls.map((tc, i) => (
				<text key={i} fg={colors.dimSeparator}>
					Tool Call - {tc.toolName}
					{tc.result !== undefined ? ` > ${summarizeResult(tc.result)}` : ""}
				</text>
			))}
		</box>
	);
}

export function AgentMessage({ message }: Props) {
	const { colors } = useTheme();

	if (isStreaming(message)) {
		return (
			<box width="100%" alignItems="center">
				<box width="100%" paddingY={1} flexWrap="wrap" gap={1} flexGrow={1} flexDirection="row">
          <Loader mode={message.mode} name="dots" />
          <text>Thinking...</text>
				</box>
			</box>
		);
	}

	return (
		<box width="100%" alignItems="center">
			<box
				width="100%"
			>
				<box
					flexDirection="column"
					paddingX={2}
					paddingY={1}
					width="100%"
					gap={1}
				>
					{message.reasoning ? (
						<ReasoningBlock reasoning={message.reasoning} />
					) : null}
					{message.content ? <Markdown content={message.content} /> : null}
					<ToolCalls message={message} />
				</box>
			</box>
		</box>
	);
}
