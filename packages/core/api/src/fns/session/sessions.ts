import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { type Session, type Message } from "../../db/schemas";
import type { ModeType } from "@border-code/shared";

export type Sessions = {
	count: number;
	sessions: Session[];
};

const SESSIONS_DIR = join(homedir(), ".border-code", "sessions");

function getSessionPath(id: string): string {
	return join(SESSIONS_DIR, `${id}.json`);
}

function readSession(id: string): Session | null {
	try {
		const data = JSON.parse(readFileSync(getSessionPath(id), "utf8"));
		return {
			...data,
			createdAt: new Date(data.createdAt),
			updatedAt: new Date(data.updatedAt),
		} as Session;
	} catch {
		return null;
	}
}

function writeSession(session: Session): void {
	mkdirSync(SESSIONS_DIR, { recursive: true });
	writeFileSync(
		getSessionPath(session.id),
		JSON.stringify(
			{
				...session,
				createdAt: session.createdAt.toISOString(),
				updatedAt: session.updatedAt.toISOString(),
			},
			null,
			2,
		),
		"utf8",
	);
}

export async function getSessions(): Promise<Sessions> {
	mkdirSync(SESSIONS_DIR, { recursive: true });
	let files: string[];
	try {
		files = readdirSync(SESSIONS_DIR).filter((f) => f.endsWith(".json"));
	} catch {
		files = [];
	}

	const sessions = files
		.map((f) => readSession(f.replace(".json", "")))
		.filter((s): s is Session => s !== null)
		.reverse();

	return { count: sessions.length, sessions };
}

export async function getSessionById(id: string) {
	const session = readSession(id);
	return { session: session ?? null };
}

export async function createSession({
	title,
	cwd,
	mode,
	messages,
}: {
	title: string;
	cwd: string;
	mode: ModeType;
	messages: Message[];
}) {
	const id = crypto.randomUUID();
	const now = new Date();
	const session = {
		id,
		title,
		cwd,
		mode,
		messages,
		createdAt: now,
		updatedAt: now,
		status: null,
	} satisfies Session;

	writeSession(session);

	return { id, session };
}

export async function updateSession(
	id: string,
	{
		title,
		cwd,
		mode,
		messages,
	}: {
		title?: string;
		cwd?: string;
		mode?: ModeType;
		messages?: Message[];
	},
) {
	const session = readSession(id);
	if (!session) {
		return null;
	}

	if (title !== undefined) session.title = title;
	if (cwd !== undefined) session.cwd = cwd;
	if (mode !== undefined) session.mode = mode;
	if (messages !== undefined) session.messages = messages;
	session.updatedAt = new Date();

	writeSession(session);

	return { id: session.id, session };
}
