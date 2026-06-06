import { useCallback, useEffect, useState } from "react";
import { useDialog } from "../../../providers/dialog";
import { DialogSearchList } from "..";
import {
	createConfig,
	fetchModels,
	getConfig,
	PROVIDERS,
	updateConfig,
	type Provider,
} from "@border-code/core-api";
import { useToast } from "../../../providers/toast";
import { useConfig } from "../../../providers/config/config";
import { usePromptConfig } from "../../../providers/config/prompt-config";

export const SelectModalDialogContent = () => {
	const dialog = useDialog();
	const { show } = useToast();
	const [models, setModels] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const { setModel, model } = usePromptConfig();
	const { refresh } = useConfig();

	useEffect(() => {
		const fetchAndUpdateModels = async () => {
			try {
				const config = await getConfig();
				const getModels = await fetchModels(
					config?.provider as Provider,
					config?.apiKey ?? "",
				);
				setModels(getModels);
			} catch (error) {
				show({
					message: "Failed to fetch models check your API key",
					variant: "error",
				});
			} finally {
				setLoading(false);
			}
		};
		fetchAndUpdateModels();
	}, []);

	const handleSelect = useCallback(
		async (item: any) => {
			dialog.close();
			try {
				await updateConfig({ model: item });
				setModel(item);
				refresh();
				show({ message: `Using ${item}`, variant: "success" });
			} catch (error) {
				show({ message: "Failed to update model", variant: "error" });
			}
		},
		[dialog, refresh],
	);

	return (
		<DialogSearchList
			items={models}
			onSelect={handleSelect}
			filterFn={(t, query) => t.toLowerCase().includes(query.toLowerCase())}
			renderItem={(item, isSelected) => (
				<text selectable={false} fg={isSelected ? "black" : "white"}>
					{item === model ? "\u0020\u2022\u0020" : "\u0020\u0020\u0020"}
					{item}
				</text>
			)}
			getKey={(t) => t}
			placeholder="Search models"
			emptyText={
				loading
					? "Fetching models..."
					: "No models found, check your API key and provider."
			}
		/>
	);
};
