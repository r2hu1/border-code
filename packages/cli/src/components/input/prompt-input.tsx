import { useEffect, useRef } from "react";
import { Mode } from "../../../../shared/src/config";
import { usePromptConfig } from "../../providers/config/prompt-config";
import { useTheme } from "../../providers/theme";
import { EmptyBorder } from "../border";
import { StatusBar } from "../status";
import type { KeyBinding, TextareaRenderable } from "@opentui/core";

type Props = {
	onSubmit: (text: string) => void;
	disabled?: boolean;
};

export const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [
	{ name: "return", action: "submit" },
	{ name: "enter", action: "submit" },
	{ name: "return", shift: true, action: "newline" },
	{ name: "enter", shift: true, action: "newline" },
];

export default function PromptInput() {
	const { colors } = useTheme();
	const { mode } = usePromptConfig();
	const textareaRef = useRef<TextareaRenderable>(null);

	return (
		<box width="100%" alignItems="center">
			<box
				border={["left"]}
				borderColor={mode === Mode.BUILD ? colors.primary : colors.planMode}
				customBorderChars={{
					...EmptyBorder,
					vertical: "┃",
					bottomLeft: "╹",
				}}
				width="100%"
			>
				<box
					position="relative"
					justifyContent="center"
					paddingX={2}
					paddingY={1}
					backgroundColor={colors.surface}
					width="100%"
					gap={1}
				>
					<textarea
						placeholder="Ask or command anything..."
						keyBindings={TEXTAREA_KEY_BINDINGS}
						ref={textareaRef}
					/>
					<StatusBar />
				</box>
			</box>
		</box>
	);
}
