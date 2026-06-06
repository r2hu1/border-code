import { useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { SessionShell } from "../components/session-shell";
import { UserMessage, AgentMessage } from "../components/messages";
import {
	getSessionById,
	updateSession,
	chat,
	type Session,
	type ToolCall,
} from "@border-code/core-api";

export default function Session() {
	const { id } = useParams();
	const [sessionData, setSessionData] = useState<Session | null>(null);
	const [isChatting, setIsChatting] = useState(false);
	const chatTriggeredRef = useRef(false);

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
		if (!sessionData || chatTriggeredRef.current) return;

		const messages = sessionData.messages;
		const lastMsg = messages[messages.length - 1];
		if (!lastMsg || lastMsg.role !== "user") return;

		chatTriggeredRef.current = true;
		setIsChatting(true);

		const runChat = async () => {
			try {
				const result = await chat({
					messages: messages.map((m) => ({
						role: m.role === "agent" ? "assistant" : "user",
						content: m.content,
					})),
					mode: lastMsg.mode,
				});

				const [text, reasoningText, rawToolCalls, rawToolResults] =
					await Promise.all([
						result.text,
						result.reasoningText,
						result.toolCalls,
						result.toolResults,
					]);

				const toolCalls: ToolCall[] = rawToolCalls.map(
					(tc: unknown, i: number) => {
						const call = tc as {
							toolName: string;
							args: Record<string, unknown>;
						};
						const res = rawToolResults[i] as
							| { result?: unknown }
							| undefined;
						return {
							toolName: call.toolName,
							args: call.args,
							result: res?.result,
						};
					},
				);

				const updated = await updateSession(id ?? "", {
					messages: [
						...messages,
						{
							role: "agent",
							content: text,
							mode: lastMsg.mode,
							reasoning: reasoningText ?? undefined,
							toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
						},
					],
				});

				if (updated?.session) {
					setSessionData(updated.session);
				}
			} catch (e) {
				chatTriggeredRef.current = false;
			} finally {
				setIsChatting(false);
			}
		};

		runChat();
	}, [sessionData, id]);

	const loading = !sessionData || isChatting;

	return (
		<SessionShell onSubmit={() => {}} inputDisabled={loading} loading={loading}>
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
