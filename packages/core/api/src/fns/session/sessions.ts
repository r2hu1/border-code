import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { sessions, type Message } from "../../db/schemas";
import type { ModeType } from "@border-code/shared";

export type Sessions = {
	count: number;
	sessions: (typeof sessions.$inferSelect)[];
};

export async function getSessions(): Promise<Sessions> {
	const result = await db.select().from(sessions);

	return {
		count: result.length,
		sessions: result,
	};
}

export async function getSessionById(id: string) {
	const result = await db
		.select()
		.from(sessions)
		.where(eq(sessions.id, id));

	return {
		session: result[0] ?? null,
	};
}

export async function createSession({
	title,
	cwd,
	model,
	mode,
	messages,
}: {
	title: string;
	cwd: string;
	model: string;
	mode: ModeType;
	messages: Message[];
}) {
	const [session] = await db
		.insert(sessions)
		.values({
			title,
			cwd,
			model,
			mode,
			messages,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning();

	return {
		id: session?.id,
		session,
	};
}

export async function updateSession(
	id: string,
	{
		title,
		cwd,
		model,
		mode,
		messages,
	}: {
		title?: string;
		cwd?: string;
		model?: string;
		mode?: ModeType;
		messages?: Message[];
	},
) {
	const updates: {
		title?: string;
		cwd?: string;
		model?: string;
		mode?: ModeType;
		messages?: Message[];
		updatedAt: Date;
	} = {
		updatedAt: new Date(),
	};

	if (title !== undefined) updates.title = title;
	if (cwd !== undefined) updates.cwd = cwd;
	if (model !== undefined) updates.model = model;
	if (mode !== undefined) updates.mode = mode;
	if (messages !== undefined) updates.messages = messages;

	const [session] = await db
		.update(sessions)
		.set(updates)
		.where(eq(sessions.id, id))
		.returning();

	if (!session) {
		return null;
	}

	return {
		id: session.id,
		session,
	};
}
