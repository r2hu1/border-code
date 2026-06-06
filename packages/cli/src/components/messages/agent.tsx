import { TextAttributes } from "@opentui/core";
import { useTheme } from "../../providers/theme";
import { Loader } from "../loader";
import type { Message } from "@border-code/core-api";
import { Markdown } from "./markdown";

type Props = {
	message: Message;
};

function hasAnything(message: Message): boolean {
	return !!(message.content || message.reasoning || message.toolCalls?.length);
}

function summarizeResult(result: unknown): string {
	const text = typeof result === "string" ? result : JSON.stringify(result);
	const words = text.split(/\s+/).filter(Boolean);
	const preview = words.slice(0, 10).join(" ");
	return words.length > 10 ? preview + "..." : preview;
}

function ReasoningBlock({ reasoning }: { reasoning: string }) {
	const { colors } = useTheme();
	return (
		<box flexDirection="column" width="100%" gap={0}>
			<box flexDirection="row" gap={1} paddingX={1}>
				<text fg={colors.dimSeparator}>{"▌"}</text>
				<text fg={colors.thinking} attributes={TextAttributes.ITALIC}>
					{reasoning}
				</text>
			</box>
		</box>
	);
}

function ToolCall({ name, result }: { name: string; result?: unknown }) {
	const { colors } = useTheme();
	const hasResult = result !== undefined;
	return (
		<box flexDirection="row" gap={1} width="100%">
			<text fg={colors.dimSeparator}>{"⚙ "}</text>
			<text fg={colors.thinking}>{name}</text>
			{hasResult ? (
				<>
					<text fg={colors.dimSeparator}>{" → "}</text>
					<text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
						{summarizeResult(result)}
					</text>
				</>
			) : (
				<text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
					<Loader name="binary"/>
				</text>
			)}
		</box>
	);
}

function ToolCalls({ message }: { message: Message }) {
	if (!message.toolCalls?.length) return null;
	return (
		<box flexDirection="column" width="100%" gap={0} paddingX={1}>
			{message.toolCalls.map((tc, i) => (
				<ToolCall key={i} name={tc.toolName} result={tc.result} />
			))}
		</box>
	);
}

export function AgentMessage({ message }: Props) {
	const { colors } = useTheme();

	if (!hasAnything(message)) {
		return (
			<box width="100%" flexDirection="row" gap={1} paddingY={1} paddingX={2}>
				<Loader mode={message.mode} name="dots" />
				<text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
					{"Thinking..."}
				</text>
			</box>
		);
	}

	return (
		<box flexDirection="column" width="100%" gap={1} paddingX={2} paddingY={1}>
			{message.reasoning ? (
				<ReasoningBlock reasoning={message.reasoning} />
			) : null}
			<ToolCalls message={message} />
			{message.content ? <Markdown content={message.content} /> : null}
		</box>
	);
}
