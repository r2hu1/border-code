import { useCallback, useEffect, useRef } from "react";
import { useDialog } from "../../../providers/dialog";
import { useTheme } from "../../../providers/theme";
import { DialogSearchList } from "..";
import { MENU_ITEMS } from "./items";
import { useNavigate } from "react-router";
import { ThemeDialogContent } from "../theme/theme-dialog";

export const CommandMenuContent = () => {
  const dialog = useDialog();
  const navigate = useNavigate()

  const handleSelect = useCallback(
    (item: typeof MENU_ITEMS[number]) => {
      switch (item.value) {
        case "exit":
          dialog.close();
          process.exit(1);
        case "new_chat":
          dialog.close();
          navigate("/sessions/new");
          break;
        case "themes":
          dialog.close();
          dialog.open({
            title: "Themes",
            children: <ThemeDialogContent/>,
          })
          break;
      }
    },
    [],
  );

  return (
    <DialogSearchList
      items={MENU_ITEMS}
      onSelect={handleSelect}
      filterFn={(t, query) => t.label.toLowerCase().includes(query.toLowerCase())}
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
