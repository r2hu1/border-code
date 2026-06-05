import { useCallback, useEffect, useRef } from "react";
import { useDialog } from "../../../providers/dialog";
import { useTheme } from "../../../providers/theme";
import { DialogSearchList } from "..";
import { MENU_ITEMS } from "./items";
import { useNavigate } from "react-router";
import { ThemeDialogContent } from "../theme/theme-dialog";
import { SessionDialogContent } from "../session/session-dialog-content";
import { ProvidersDialogContent } from "../providers/providers-menu-content";

export const CommandMenuContent = () => {
	const dialog = useDialog();
	const navigate = useNavigate();

	const handleSelect = useCallback((item: (typeof MENU_ITEMS)[number]) => {
		switch (item.value) {
			case "new_chat":
				dialog.close();
				navigate("/sessions/new");
				break;
			case "sessions":
				dialog.close();
				dialog.open({
					title: "Sessions",
					children: <SessionDialogContent />,
				});
				break;
			case "llm_providers":
				dialog.close();
				dialog.open({
					title: "Select a provider",
					children: <ProvidersDialogContent />,
				});
				break;
			case "themes":
				dialog.close();
				dialog.open({
					title: "Themes",
					children: <ThemeDialogContent />,
				});
				break;
			case "exit":
				dialog.close();
				process.exit(1);
		}
	}, []);

	return (
		<DialogSearchList
			items={MENU_ITEMS}
			onSelect={handleSelect}
			filterFn={(t, query) =>
				t.label.toLowerCase().includes(query.toLowerCase())
			}
			renderItem={(item, isSelected) => (
				<text selectable={false} fg={isSelected ? "black" : "white"}>
					{item.label}
				</text>
			)}
			getKey={(t) => t.value}
			placeholder="Search commands"
			emptyText="No matching commands"
		/>
	);
};
