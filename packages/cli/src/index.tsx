import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { Header } from "./components/header";
import { ThemeProvider } from "./providers/theme";
import { ToastProvider } from "./providers/toast";

function App() {
	return (
		<ThemeProvider>
			<ToastProvider>
				<box alignItems="center" justifyContent="center" flexGrow={1}>
					<box justifyContent="center" alignItems="flex-end">
						<Header />
					</box>
				</box>
			</ToastProvider>
		</ThemeProvider>
	);
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
