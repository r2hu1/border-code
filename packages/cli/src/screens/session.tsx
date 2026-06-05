import z from "zod";
import { modeSchema } from "../../../shared/src/config";
import { useNavigate, useLocation, useParams } from "react-router";
import { useToast } from "../providers/toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { SessionShell } from "../components/session-shell";
import { UserMessage } from "../components/messages";
import { createSession, getSessionById, type Session } from "@border-code/core-api";
import { useConfig } from "../providers/config/config";
import { usePromptConfig } from "../providers/config/prompt-config";

const sessionStateSchema = z.object({
	message: z.string(),
	mode: modeSchema,
});

export default function Session() {
  const { id } = useParams();
	const location = useLocation();
	const toast = useToast();
	const { mode, model } = usePromptConfig();
  const [sessionData, setSessionData] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const req = await getSessionById(id ?? "")
        setSessionData(req.session);
      }
      catch (e) {

      }
    };

    fetchSessionData();
  }, []);

	return (
    <SessionShell onSubmit={() => { }} inputDisabled>
      {sessionData?.messages.map((msg, i) => {
        switch (msg.role) {
          case "user":
            return <UserMessage key={i} message={msg.content} mode={msg.mode} />;
          case "agent":
            return <text>{msg.content}</text>;
          default:
            return null;
        }
      })}
		</SessionShell>
	);
}
