import { useParams } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SessionShell } from "../components/session-shell";
import { UserMessage, AgentMessage } from "../components/messages";
import { useToast } from "../providers/toast";
import { useConfig } from "../providers/config/config";
import {
	getSessionById,
	updateSession,
	chat,
	type Session,
	type Message,
} from "@border-code/core-api";

async function streamResponse(
	id: string,
	messages: Message[],
	mode: Message["mode"],
	onUpdate: (messages: Message[]) => void,
	onDone: () => void,
	onError: () => void,
) {
	const agentMsg: Message = { role: "agent", content: "", mode };
	onUpdate([...messages, agentMsg]);

	try {
		await chat({
			messages: messages.map((m) => ({
				role: m.role === "agent" ? "assistant" : "user",
				content: m.content,
			})),
			mode,
			onText(chunk) {
				agentMsg.content += chunk;
				onUpdate([...messages, { ...agentMsg }]);
			},
			onFinish: async (result) => {
				const final: Message = {
					role: "agent",
					content: result.text,
					mode,
					reasoning: result.reasoning,
					toolCalls:
						result.toolCalls.length > 0 ? result.toolCalls : undefined,
				};
				const allMessages = [...messages, final];
				await updateSession(id, { messages: allMessages });
				onUpdate(allMessages);
				onDone();
			},
		});
	} catch {
		onError();
	}
}

export default function Session() {
	const { id } = useParams();
	const { show } = useToast();
	const { provider, model, apiKey, refresh } = useConfig();
	const [sessionData, setSessionData] = useState<Session | null>(null);
	const busyRef = useRef(false);

	useEffect(() => {
		const fetchSessionData = async () => {
			try {
				const req = await getSessionById(id ?? "");
				setSessionData(req.session);
			} catch (e) {}
		};

		fetchSessionData();
	}, [id]);

	useEffect(() => {
		if (!sessionData || busyRef.current) return;

		const messages = sessionData.messages;
		const lastMsg = messages[messages.length - 1];
		if (!lastMsg || lastMsg.role !== "user") return;

		busyRef.current = true;

		streamResponse(
			id ?? "",
			messages,
			lastMsg.mode,
			(m) => setSessionData((prev) => (prev ? { ...prev, messages: m } : prev)),
			() => { busyRef.current = false; },
			() => { busyRef.current = false; },
		);
	}, [sessionData, id]);

	const handleSubmit = useCallback(
		async (text: string) => {
			if (!sessionData || busyRef.current) return;

			await refresh();
			if (!provider) {
				show({ message: "No provider configured", variant: "error" });
				throw new Error("No provider configured");
			}
			if (!model) {
				show({ message: "No model configured", variant: "error" });
				throw new Error("No model configured");
			}
			if (!apiKey) {
				show({ message: "No API key configured", variant: "error" });
				throw new Error("No API key configured");
			}

			const userMsg: Message = {
				role: "user",
				content: text,
				mode: sessionData.mode,
			};
			const withUser = [...sessionData.messages, userMsg];
			const updated = await updateSession(id ?? "", { messages: withUser });
			if (updated?.session) {
				setSessionData(updated.session);
			}

			busyRef.current = true;
			streamResponse(
				id ?? "",
				withUser,
				sessionData.mode,
				(m) => setSessionData((prev) => (prev ? { ...prev, messages: m } : prev)),
				() => { busyRef.current = false; },
				() => { busyRef.current = false; },
			);
		},
		[sessionData, id, provider, model, apiKey, refresh, show],
	);

	const loading = !sessionData || busyRef.current;

	return (
		<SessionShell onSubmit={handleSubmit} inputDisabled={loading} loading={loading}>
			{sessionData?.messages.map((msg, i) => {
				switch (msg.role) {
					case "user":
						return (
							<UserMessage key={i} message={msg.content} mode={msg.mode} />
						);
					case "agent":
						return <AgentMessage key={i} message={msg} />;
					default:
						return null;
				}
			})}
		</SessionShell>
	);
}
