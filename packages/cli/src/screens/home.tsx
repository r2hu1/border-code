import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/header";
import { usePromptConfig } from "../providers/config/prompt-config";
import { TextAttributes } from "@opentui/core";
import PromptInput from "../components/input/prompt-input";

export function Home() {
	const navigate = useNavigate();
	const { mode, model } = usePromptConfig();

	const handleSubmit = useCallback(
		(text: string) => {
			navigate("/sessions/new", { state: { message: text, mode, model } });
		},
		[navigate, mode, model],
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
						<text attributes={TextAttributes.DIM}>mode</text>
					</box>
					<box flexDirection="row" gap={1}>
						<text>/</text>
						<text attributes={TextAttributes.DIM}>commands</text>
					</box>
				</box>
			</box>
		</box>
	);
}
