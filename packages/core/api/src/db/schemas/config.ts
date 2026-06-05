import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const config = sqliteTable("config", {
	id: text("id").primaryKey().default("default"),
	provider: text("provider").notNull(),
	apiKey: text("api_key").notNull(),
	model: text("model").notNull(),
});
export type Config = typeof config.$inferSelect;
