import { useCallback } from "react";
import { useDialog } from "../../../providers/dialog";
import { DialogSearchList } from "..";
import { PROVIDERS } from "@border-code/core-api";

export const ProvidersDialogContent = () => {
	const dialog = useDialog();

	const handleSelect = useCallback(
		(item: any) => {
			dialog.close();
		},
		[dialog],
	);

	return (
		<DialogSearchList
			items={PROVIDERS}
			onSelect={handleSelect}
			filterFn={(t, query) => t.toLowerCase().includes(query.toLowerCase())}
			renderItem={(item, isSelected) => (
				<text selectable={false} fg={isSelected ? "black" : "white"}>
					{item}
				</text>
			)}
			getKey={(t) => t}
			placeholder="Search themes"
			emptyText="No sessions yet"
		/>
	);
};
