import { Outlet } from "react-router";
import { ToastProvider } from "../providers/toast";
import {
	KeyboardLayerProvider,
	useKeyboardLayer,
} from "../providers/config/keyboard";
import { ThemeProvider } from "../providers/theme";
import { ThemedRoot } from "./themed-root";
import {
	PromptConfigProvider,
	usePromptConfig,
} from "../providers/config/prompt-config";
import { DialogProvider } from "../providers/dialog";
import { ConfigProvider } from "../providers/config/config";

export function RootLayout() {
	return (
		<ConfigProvider>
			<PromptConfigProvider>
				<ThemeProvider>
					<ToastProvider>
						<KeyboardLayerProvider>
							<DialogProvider>
								<ThemedRoot>
									<Outlet />
								</ThemedRoot>
							</DialogProvider>
						</KeyboardLayerProvider>
					</ToastProvider>
				</ThemeProvider>
			</PromptConfigProvider>
		</ConfigProvider>
	);
}
