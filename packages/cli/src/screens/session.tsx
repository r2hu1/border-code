import z from "zod";
import { modeSchema } from "../../../shared/src/config";
import { useNavigate, useLocation } from "react-router";
import { useToast } from "../providers/toast";
import { useEffect, useMemo, useRef } from "react";
import { SessionShell } from "../components/session-shell";
import { UserMessage } from "../components/messages";
import { createSession } from "@border-code/core-api";
import { useConfig } from "../providers/config/config";
import { usePromptConfig } from "../providers/config/prompt-config";

const sessionStateSchema = z.object({
	message: z.string(),
	mode: modeSchema,
});

export default function Session() {
	const navigate = useNavigate();
	const location = useLocation();
	const toast = useToast();
	const { mode, model } = usePromptConfig();

	return (
		<SessionShell onSubmit={() => {}} inputDisabled>
			<UserMessage message={""} mode={mode} />
		</SessionShell>
	);
}
