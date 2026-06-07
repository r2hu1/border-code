// Updated: drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./packages/core/api/src/db/schemas/index.ts",
	out: "./drizzle",
	dbCredentials: {
		url: "./local.db",
	},
	verbose: true,
	strict: true,
});
