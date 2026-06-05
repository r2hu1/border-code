import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { config } from "./db/schemas";

export async function createConfig({
	id = "default",
	provider = "",
	apiKey = "",
	model = "",
}: {
	id?: string;
	provider?: string;
	apiKey?: string;
	model?: string;
}) {
	const existingConfig = await db
		.select()
		.from(config)
		.where(eq(config.id, id));

	if (existingConfig.length > 0) {
		return existingConfig[0];
	}

	const result = await db
		.insert(config)
		.values({ id, provider, apiKey, model })
		.returning();

	return result[0];
}

export async function getConfig() {
	const existingConfig = await db
		.select()
		.from(config)
		.where(eq(config.id, "default"));

	if (existingConfig.length > 0) {
		return existingConfig[0];
	}

	return createConfig({
		id: "default",
		provider: "",
		apiKey: "",
		model: "",
	});
}

export async function updateConfig({
	provider,
	apiKey,
	model,
}: {
	provider?: string;
	apiKey?: string;
	model?: string;
}) {
	const updates: Record<string, string> = {};

	if (provider !== undefined) updates.provider = provider;
	if (apiKey !== undefined) updates.apiKey = apiKey;
	if (model !== undefined) updates.model = model;

	const result = await db
		.update(config)
		.set(updates)
		.where(eq(config.id, "default"))
		.returning();

	return result[0];
}
