import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { sessions, type Message } from "../../db/schemas";
import type { ModeType } from "@border-code/shared";

export type Sessions = {
	count: number;
	sessions: (typeof sessions.$inferSelect)[];
};

export async function getSessions() {
	const result = await db.select().from(sessions);
	if (result.length === 0)
		return {
			count: 0,
			sessions: [],
		};
	return {
		count: result.length,
		sessions: result,
	};
}

export async function getSessionById(id: string) {
	const result = await db.select().from(sessions).where(eq(sessions.id, id));
	if (result.length === 0)
		return {
			session: null,
		};
	return {
		session: result[0],
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
	const result = await db
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
		id: result[0]?.id,
		session: {
			title: result[0]?.title,
			cwd: result[0]?.cwd,
			model: result[0]?.model,
			mode: result[0]?.mode,
			messages: result[0]?.messages,
			createdAt: result[0]?.createdAt,
			updatedAt: result[0]?.updatedAt,
		},
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
	const existingSession = await getSessionById(id);
	if (!existingSession.session) return null;

	const combinedProps = {
		title: title ?? existingSession.session.title,
		cwd: cwd ?? existingSession.session.cwd,
		model: model ?? existingSession.session.model,
		mode: mode ?? existingSession.session.mode,
		messages: messages ?? existingSession.session.messages,
	};

	const result = await db
		.update(sessions)
		.set({
			...combinedProps,
			updatedAt: new Date(),
		})
		.where(eq(sessions.id, id))
		.returning();
	return {
		id: result[0]?.id,
		session: {
			title: result[0]?.title,
			cwd: result[0]?.cwd,
			model: result[0]?.model,
			mode: result[0]?.mode,
			messages: result[0]?.messages,
			createdAt: result[0]?.createdAt,
			updatedAt: result[0]?.updatedAt,
		},
	};
}
