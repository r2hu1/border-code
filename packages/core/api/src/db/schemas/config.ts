import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const config = sqliteTable("config", {
	id: text("id").default("default").primaryKey(),
	provider: text("provider"),
	apiKey: text("api_key"),
	model: text("model"),
});
export type Config = typeof config.$inferSelect;
