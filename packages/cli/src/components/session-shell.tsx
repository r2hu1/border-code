import { TextAttributes } from "@opentui/core";
import type { ReactNode } from "react";
import { Loader } from "./loader";
import { usePromptConfig } from "../providers/config/prompt-config";
import PromptInput from "./input/prompt-input";
import { useTheme } from "../providers/theme";

type Props = {
	children?: ReactNode;
	onSubmit: (text: string) => void | Promise<void>;
	inputDisabled?: boolean;
	loading?: boolean;
	interruptible?: boolean;
};

export function SessionShell({
	children,
	onSubmit,
	inputDisabled = false,
	loading = false,
	interruptible = false,
}: Props) {
	const { mode } = usePromptConfig();
	const { colors } = useTheme();

	return (
		<box
			flexDirection="column"
			flexGrow={1}
			width="100%"
			height="100%"
			paddingY={1}
			paddingX={2}
			gap={1}
		>
			<scrollbox flexGrow={1} width="100%" stickyScroll stickyStart="bottom">
				<box>{children}</box>
			</scrollbox>
			<box flexShrink={0}>
				<PromptInput onSubmit={onSubmit} disabled={inputDisabled || loading} />
			</box>
			<box
				flexShrink={0}
				flexDirection="row"
				justifyContent="space-between"
				width="100%"
				height={1}
				gap={2}
				paddingLeft={1}
			>
				<box flexDirection="row" alignItems="center" gap={2}>
					{loading ? (
						<>
							<Loader mode={mode} />
							<text>esc</text>
							<text fg={colors.dimSeparator}>interrupt</text>
						</>
					) : (
						<text fg={colors.dimSeparator}>~{process.cwd()}</text>
					)}
				</box>

				<box flexDirection="row" gap={2} flexShrink={0} marginLeft="auto">
					<box flexDirection="row" gap={1}>
						<text>tab</text>
						<text attributes={TextAttributes.DIM}>agents</text>
					</box>
					<box flexDirection="row" gap={1}>
						<text>shift+tab</text>
						<text attributes={TextAttributes.DIM}>commands</text>
					</box>
				</box>
			</box>
		</box>
	);
}
