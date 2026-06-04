import { TextAttributes } from "@opentui/core";
import { useTheme } from "../providers/theme";
import { usePromptConfig } from "../providers/config/prompt-config";
import { Mode } from "@border-code/shared";

export function StatusBar() {
	const { mode, model } = usePromptConfig();
	const { colors } = useTheme();

	return (
		<box flexDirection="row" gap={1}>
			<text fg={mode === Mode.PLAN ? colors.planMode : colors.primary}>
				{mode === Mode.PLAN ? "Plan" : "Build"}
			</text>

			<text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
				›
			</text>
			<text>{model ?? "None"}</text>
		</box>
	);
}
