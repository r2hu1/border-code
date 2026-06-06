import { TextAttributes } from "@opentui/core";
import { EmptyBorder, SplitBorderChars } from "../border";
import { useTheme } from "../../providers/theme";
import type { Message } from "@border-code/core-api";

type Props = {
	message: Message;
};

function ToolCalls({ message }: { message: Message }) {
	const { colors } = useTheme();

	if (!message.toolCalls?.length) return null;

	return (
		<box flexDirection="column" width="100%" gap={0}>
			{message.toolCalls.map((tc, i) => (
				<box key={i} flexDirection="column" width="100%" gap={0}>
					<text attributes={TextAttributes.DIM}>
						── Tool: {tc.toolName} ──
					</text>
					<text attributes={TextAttributes.DIM}>
						{JSON.stringify(tc.args)}
					</text>
					{tc.result !== undefined ? (
						<text attributes={TextAttributes.DIM}>
							→ {JSON.stringify(tc.result).slice(0, 200)}
						</text>
					) : null}
				</box>
			))}
		</box>
	);
}

export function AgentMessage({ message }: Props) {
	const { colors } = useTheme();

	return (
		<box width="100%" alignItems="center">
			<box
				border={["left"]}
				borderColor={colors.primary}
				width="100%"
				customBorderChars={{
					...EmptyBorder,
					...SplitBorderChars,
				}}
			>
				<box
					flexDirection="column"
					paddingX={2}
					paddingY={1}
					backgroundColor={colors.surface}
					width="100%"
					gap={1}
				>
					{message.reasoning ? (
						<text attributes={TextAttributes.DIM | TextAttributes.ITALIC}>
							{message.reasoning}
						</text>
					) : null}
					{message.content ? <text>{message.content}</text> : null}
					<ToolCalls message={message} />
				</box>
			</box>
		</box>
	);
}
