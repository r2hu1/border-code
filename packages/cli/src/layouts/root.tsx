import { Outlet } from "react-router";
import { ToastProvider } from "../providers/toast";
import { KeyboardLayerProvider, useKeyboardLayer } from "../providers/config/keyboard";
import { ThemeProvider } from "../providers/theme";
import { ThemedRoot } from "./themed-root";
import { PromptConfigProvider, usePromptConfig } from "../providers/config/prompt-config";
import { DialogProvider } from "../providers/dialog";

export function RootLayout() {

	return (
		<ThemeProvider>
			<ToastProvider>
				<KeyboardLayerProvider>
					<DialogProvider>
					<PromptConfigProvider>
						<ThemedRoot>
							<Outlet />
						</ThemedRoot>
					</PromptConfigProvider>
					</DialogProvider>
				</KeyboardLayerProvider>
			</ToastProvider>
		</ThemeProvider>
	);
}
