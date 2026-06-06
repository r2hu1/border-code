import { useParams } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useKeyboard } from "@opentui/react";
import { SessionShell } from "../components/session-shell";
import { UserMessage, AgentMessage } from "../components/messages";
import { useToast } from "../providers/toast";
import { useConfig } from "../providers/config/config";
import { usePromptConfig } from "../providers/config/prompt-config";
import {
	getSessionById,
	updateSession,
	getConfig,
	chat,
	type Session,
	type Message,
} from "@border-code/core-api";

async function streamResponse(
	id: string,
	messages: Message[],
	mode: Message["mode"],
	provider: string,
	model: string,
	apiKey: string,
	onUpdate: (messages: Message[]) => void,
	onDone: () => void,
	onError: (error?: Error) => void,
	abortSignal?: AbortSignal,
) {
	const agentMsg: Message = { role: "agent", content: "", mode };
	onUpdate([...messages, agentMsg]);

	const finish = async (text: string, reason?: string) => {
		const final: Message = {
			role: "agent",
			content: text,
			mode,
			reasoning: reason,
		};
		const allMessages = [...messages, final];
		await updateSession(id, { messages: allMessages });
		onUpdate(allMessages);
		onDone();
	};

	try {
		await chat({
			messages: messages.map((m) => ({
				role: m.role === "agent" ? "assistant" : "user",
				content: m.content,
			})),
			mode,
			provider,
			model,
			apiKey,
			abortSignal,
			onText(chunk) {
				agentMsg.content += chunk;
				onUpdate([...messages, { ...agentMsg }]);
			},
			onFinish: async (result) => {
				await finish(result.text, result.reasoning);
			},
		});
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			await finish(agentMsg.content);
		} else {
			onUpdate(messages);
			onError(err instanceof Error ? err : undefined);
		}
	}
}

export default function Session() {
	const { id } = useParams();
	const { show } = useToast();
	const { provider, model, apiKey, refresh } = useConfig();
	const { mode: contextMode } = usePromptConfig();
	const [sessionData, setSessionData] = useState<Session | null>(null);
	const busyRef = useRef(false);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		const fetchSessionData = async () => {
			try {
				const req = await getSessionById(id ?? "");
				setSessionData(req.session);
			} catch (e) {}
		};

		fetchSessionData();
	}, [id]);

	useKeyboard((key) => {
		if (key.name === "escape" && busyRef.current && abortRef.current) {
			abortRef.current.abort();
		}
	});

	useEffect(() => {
		if (!sessionData || busyRef.current) return;

		const messages = sessionData.messages;
		const lastMsg = messages[messages.length - 1];
		if (!lastMsg || lastMsg.role !== "user") return;

		busyRef.current = true;
		abortRef.current = new AbortController();

		streamResponse(
			id ?? "",
			messages,
			lastMsg.mode,
			provider ?? "",
			model ?? "",
			apiKey ?? "",
			(m) => setSessionData((prev) => (prev ? { ...prev, messages: m } : prev)),
			() => {
				busyRef.current = false;
				abortRef.current = null;
			},
			(err) => {
				busyRef.current = false;
				abortRef.current = null;
				show({
					message: err?.message ?? "Failed to get response",
					variant: "error",
				});
			},
			abortRef.current.signal,
		);
	}, [sessionData, id, provider, model, apiKey, show]);

	const handleSubmit = useCallback(
		async (text: string) => {
			if (!sessionData || busyRef.current) return;

			const config = await getConfig();
			const currentProvider = config?.provider ?? "";
			const currentModel = config?.model ?? "";
			const currentApiKey = config?.apiKey ?? "";

			if (!currentProvider) {
				show({ message: "No provider configured", variant: "error" });
				throw new Error("No provider configured");
			}
			if (!currentModel) {
				show({ message: "No model configured", variant: "error" });
				throw new Error("No model configured");
			}
			if (!currentApiKey) {
				show({ message: "No API key configured", variant: "error" });
				throw new Error("No API key configured");
			}

			refresh();

			const userMsg: Message = {
				role: "user",
				content: text,
				mode: contextMode,
			};
			const withUser = [...sessionData.messages, userMsg];
			const updated = await updateSession(id ?? "", {
				messages: withUser,
				mode: contextMode,
			});
			busyRef.current = true;

			if (updated?.session) {
				setSessionData(updated.session);
			}
			abortRef.current = new AbortController();
			streamResponse(
				id ?? "",
				withUser,
				contextMode,
				currentProvider,
				currentModel,
				currentApiKey,
				(m) =>
					setSessionData((prev) => (prev ? { ...prev, messages: m } : prev)),
				() => {
					busyRef.current = false;
					abortRef.current = null;
				},
				(err) => {
					busyRef.current = false;
					abortRef.current = null;
					show({
						message: err?.message ?? "Failed to get response",
						variant: "error",
					});
				},
				abortRef.current!.signal,
			);
		},
		[sessionData, id, show, contextMode, refresh],
	);

	const loading = !sessionData || busyRef.current;

	return (
		<SessionShell
			onSubmit={handleSubmit}
			inputDisabled={loading}
			loading={loading}
		>
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
