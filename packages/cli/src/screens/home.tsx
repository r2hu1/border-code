import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/header";
import { usePromptConfig } from "../providers/config/prompt-config";
import { TextAttributes } from "@opentui/core";
import PromptInput from "../components/input/prompt-input";
import path from "path";
import { cwd } from "process";
import { useTheme } from "../providers/theme";
import { useConfig } from "../providers/config/config";
import { useToast } from "../providers/toast";

export function Home() {
	const navigate = useNavigate();
	const { colors } = useTheme();
	const { show } = useToast();
	const { mode } = usePromptConfig();
	const { provider, model, apiKey, refresh } = useConfig();

	const handleSubmit = useCallback(
		async (text: string) => {
			await refresh();
			if (!provider) {
				show({
					message: "No provider configured",
					variant: "error",
				});
				return;
			}
			if (!model) {
				show({
					message: "No model configured",
					variant: "error",
				});
				return;
			}
			if (!apiKey) {
				show({
					message: "No API key configured",
					variant: "error",
				});
				return;
			}
			navigate("/sessions/new", { state: { message: text, mode } });
		},
		[navigate, mode, provider, model, apiKey, refresh, show],
	);

	return (
		<box
			alignItems="center"
			justifyContent="center"
			flexGrow={1}
			gap={2}
			position="relative"
			width="100%"
			height="100%"
		>
			<Header />
			<box
				width="100%"
				maxWidth={78}
				paddingX={2}
				flexDirection="column"
				gap={1}
			>
				<PromptInput onSubmit={handleSubmit} />
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
			<text position="absolute" bottom={0} left={0} fg={colors.dimSeparator}>
				~{cwd()}
			</text>
		</box>
	);
}
