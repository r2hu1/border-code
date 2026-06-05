import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { config } from "./db/schemas";

export async function createConfig({
  id = "default",
  provider = "",
  apiKey = "",
  model = "",
}) {
  const result = await db.insert(config).values({ id, provider, apiKey, model }).returning();
  return result[0];
}

export async function getConfig() {
  const econfig = await db.select().from(config).where(eq(config.id, "default"));
  if (econfig) return econfig[0];
  const cconfig = await createConfig({ id: "default", provider: "", apiKey: "", model: "" });
  return cconfig;
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
  const result = await db.update(config).set({ provider, apiKey, model }).where(eq(config.id, "default")).returning();
  return result[0];
}
