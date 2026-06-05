import z from "zod";
import { modeSchema } from "../../../shared/src/config";
import { useNavigate, useLocation } from "react-router";
import { useToast } from "../providers/toast";
import { useEffect, useMemo, useRef } from "react";
import { SessionShell } from "../components/session-shell";
import { UserMessage } from "../components/messages";

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

	return (
		<SessionShell onSubmit={() => {}} inputDisabled loading>
      <UserMessage message={state?.message ?? ''} mode={state?.mode ?? "BUILD"} />
		</SessionShell>
	);
}
