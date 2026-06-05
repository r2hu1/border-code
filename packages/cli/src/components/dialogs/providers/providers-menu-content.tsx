import { useCallback } from "react";
import { useDialog } from "../../../providers/dialog";
import { DialogSearchList } from "..";
import { createConfig, PROVIDERS, updateConfig } from "@border-code/core-api";
import { AddApiKeyDialog } from "./add-api-key";
import { useToast } from "../../../providers/toast";

export const ProvidersDialogContent = () => {
  const dialog = useDialog();
  const { show } = useToast();

	const handleSelect = useCallback(
		async(item: any) => {
      dialog.close();
      const req = await createConfig({
        provider: item,
      });
      if (req) {
        show({
          message: "Provider updated",
          variant: "success",
        })
      }
      dialog.open({
        title: "Add API Key",
        children: <AddApiKeyDialog/>,
      })
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
