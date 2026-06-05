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
	const [provider, setProvider] = useState<string | null | undefined>(null);
	const [model, setModel] = useState<string | null | undefined>(null);

	useEffect(() => {
		const updateConfig = async () => {
			try {
				const llmModel = await getConfig();
				setModel(llmModel?.model);
				setProvider(llmModel?.provider);
			} catch (e) {
				setModel(undefined);
				setProvider(null);
			}
		};
		updateConfig();
	}, []);

	return (
		<Config.Provider
			value={{
				provider,
				model,
			}}
		>
			{children}
		</Config.Provider>
	);
}
