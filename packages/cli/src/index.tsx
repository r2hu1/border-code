import { createCliRenderer, TextAttributes } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { Header } from "./components/header";
import { ThemeProvider } from "./providers/theme";
import { ToastProvider } from "./providers/toast";
import PromptInput from "./components/input/prompt-input";
import { PromptConfigProvider } from "./providers/config/prompt-config";

function App() {
	return (
		<ThemeProvider>
			<PromptConfigProvider>
				<ToastProvider>
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
							<PromptInput />

              <box flexDirection="row" gap={2} flexShrink={0} marginLeft="auto">
                <box flexDirection="row" gap={1}>
								<text>tab</text>
								<text attributes={TextAttributes.DIM}>agents</text>
                </box>
                <box flexDirection="row" gap={1}>
								<text>/</text>
								<text attributes={TextAttributes.DIM}>command menu</text>
                </box>
							</box>

						</box>
					</box>
				</ToastProvider>
			</PromptConfigProvider>
		</ThemeProvider>
	);
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
