import type { ModeType } from "@border-code/shared";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export interface Message {
	role: "user" | "agent";
	content: string;
}

export const sessions = sqliteTable("sessions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text("title").notNull(),
	cwd: text("cwd").notNull(),
	model: text("model").notNull(),
	mode: text("mode").notNull().$type<ModeType>(),
	messages: text("messages", { mode: "json" }).$type<Message[]>().notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
export type Session = typeof sessions.$inferSelect;
