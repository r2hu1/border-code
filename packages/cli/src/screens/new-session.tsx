import z from "zod";
import { modeSchema } from "../../../shared/src/config";
import { useNavigate, useLocation } from "react-router";
import { useToast } from "../providers/toast";
import { useEffect, useMemo, useRef } from "react";
import { SessionShell } from "../components/session-shell";
import { UserMessage } from "../components/messages";
import { createSession } from "@border-code/core-api";

const newSessionStateSchema = z.object({
	message: z.string(),
	mode: modeSchema,
});

export default function NewSession() {
	const navigate = useNavigate();
	const location = useLocation();
	const toast = useToast();
	const hasStartedRef = useRef(false);

	const state = useMemo(() => {
		const parsed = newSessionStateSchema.safeParse(location.state);
		return parsed.success ? parsed.data : null;
	}, [location.state]);

	useEffect(() => {
		if (!state) {
			navigate("/", { replace: true });
		}
	}, [state, navigate]);

	useEffect(() => {
		if (!state || hasStartedRef.current) return;

		hasStartedRef.current = true;

		let ignore = false;
		const createDbSession = async () => {
			try {
				const res = await createSession({
					title: state.message.slice(0, 200),
					cwd: process.cwd(),
					mode: state.mode,
					messages: [
						{
							role: "user",
							content: state.message,
							mode: state.mode,
						},
					],
				});

				if (ignore) return;
				if (!res.id) {
					throw new Error("Failed to create session");
				}
				navigate(`/sessions/${res.id}`, {
					replace: true,
					state: { session: res, initialPrompt: state },
				});
			} catch (error) {
				if (ignore) return;
				toast.show({
					variant: "error",
					message:
						error instanceof Error ? error.message : "Failed to create session",
				});
				navigate("/", { replace: true });
			}
		};

		createDbSession();
		return () => {
			ignore = true;
		};
	}, [state, navigate, toast]);

	if (!state) return null;

	return (
		<SessionShell onSubmit={() => {}} inputDisabled loading>
			<UserMessage
				message={state?.message ?? ""}
				mode={state?.mode ?? "BUILD"}
			/>
		</SessionShell>
	);
}
