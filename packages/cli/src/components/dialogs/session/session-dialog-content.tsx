import { useCallback, useEffect, useRef, useState } from "react";
import { useDialog } from "../../../providers/dialog";
import { DialogSearchList } from "..";
import { getSessions, type Sessions } from "@border-code/core-api";
import { useNavigate } from "react-router";

export const SessionDialogContent = () => {
	const dialog = useDialog();
	const navigate = useNavigate();
	const [sessions, setSessions] = useState<Sessions | null>(null);

	useEffect(() => {
		const fetchSessions = async () => {
			const response = await getSessions();
			setSessions(response);
		};
		fetchSessions();
	}, []);

	const handleSelect = useCallback(
		(item: any) => {
			dialog.close();
			navigate(`/sessions/${item.id}`);
		},
		[dialog, navigate],
	);

	return (
		<DialogSearchList
			items={sessions?.sessions ?? []}
			onSelect={handleSelect}
			filterFn={(t, query) =>
				t.title.toLowerCase().includes(query.toLowerCase())
			}
			renderItem={(item, isSelected) => (
				<text selectable={false} fg={isSelected ? "black" : "white"}>
					{item.title}
				</text>
			)}
			getKey={(t) => t.title}
			placeholder="Search sessions"
			emptyText="No sessions yet"
		/>
	);
};
