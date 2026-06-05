import {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
} from "react";
import type { ReactNode } from "react";
import { Mode, type ModeType } from "../../../../shared/src/config";
import { getConfig } from "@border-code/core-api";

export const DEFAULT_CHAT_MODEL_ID = "";

type ConfigValue = {
	model: string | null | undefined;
	provider: string | null | undefined;
	apiKey: string | null | undefined;
	refresh: () => Promise<void>;
};

const Config = createContext<ConfigValue | null>(null);

export function useConfig(): ConfigValue {
	const value = useContext(Config);
	if (!value) {
		throw new Error("useConfig must be used within a ConfigProvider");
	}
	return value;
}

type ConfigProps = {
	children: ReactNode;
};

export function ConfigProvider({ children }: ConfigProps) {
	const [provider, setProvider] = useState<string | null>();
	const [model, setModel] = useState<string | null>();
	const [apiKey, setApiKey] = useState<string | null>();

	const refresh = useCallback(async () => {
		const config = await getConfig();

		setProvider(config?.provider);
		setModel(config?.model);
		setApiKey(config?.apiKey);
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return (
		<Config.Provider
			value={{
				provider,
				model,
				apiKey,
				refresh,
			}}
		>
			{children}
		</Config.Provider>
	);
}
