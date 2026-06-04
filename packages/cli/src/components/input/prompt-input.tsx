import { Mode } from "../../../../shared/src/config";
import { usePromptConfig } from "../../providers/config/prompt-config";
import { useTheme } from "../../providers/theme";
import { EmptyBorder } from "../border";
import { StatusBar } from "../status";

export default function PromptInput() {
	const { colors } = useTheme();
	const {mode} = usePromptConfig()
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
          <textarea placeholder="Ask or command anything..." />
					<StatusBar/>
				</box>
			</box>
		</box>
	);
}
