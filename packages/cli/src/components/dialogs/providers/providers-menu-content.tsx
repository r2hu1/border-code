import { useCallback } from "react";
import { useDialog } from "../../../providers/dialog";
import { DialogSearchList } from "..";
import { PROVIDERS, updateConfig } from "@border-code/core-api";
import { AddApiKeyDialog } from "./add-api-key";
import { useToast } from "../../../providers/toast";
import { useConfig } from "../../../providers/config/config";

export const ProvidersDialogContent = () => {
	const dialog = useDialog();
	const { show } = useToast();
	const { provider, refresh } = useConfig();

	const handleSelect = useCallback(
		async (item: string) => {
			dialog.close();

			const req = await updateConfig({
				provider: item,
			});

			if (req) {
				await refresh();

				show({
					message: "Provider updated",
					variant: "success",
				});
			}

			dialog.open({
				title: "Add API Key",
				children: <AddApiKeyDialog />,
			});
		},
		[dialog, show, refresh],
	);

	return (
		<DialogSearchList
			items={PROVIDERS}
			onSelect={handleSelect}
			filterFn={(t, query) => t.toLowerCase().includes(query.toLowerCase())}
			renderItem={(item, isSelected) => (
				<text selectable={false} fg={isSelected ? "black" : "white"}>
					{item === provider ? "\u0020\u2022\u0020" : "\u0020\u0020\u0020"}
					{item}
				</text>
			)}
			getKey={(t) => t}
			placeholder="Search providers"
			emptyText="No matches found."
		/>
	);
};
