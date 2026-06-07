import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".border-code");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

type ConfigData = {
	id: string;
	provider: string | null;
	apiKey: string | null;
	model: string | null;
};

function readConfig(): ConfigData | null {
	try {
		return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
	} catch {
		return null;
	}
}

function writeConfig(data: ConfigData): void {
	mkdirSync(CONFIG_DIR, { recursive: true });
	writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), "utf8");
}

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
	const existing = readConfig();
	if (existing && existing.id === id) {
		return existing;
	}

	const data: ConfigData = { id, provider, apiKey, model };
	writeConfig(data);
	return data;
}

export async function getConfig() {
	const existing = readConfig();
	if (existing) {
		return existing;
	}

	const data: ConfigData = { id: "default", provider: "", apiKey: "", model: "" };
	writeConfig(data);
	return data;
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
	const existing = readConfig() ?? { id: "default", provider: "", apiKey: "", model: "" };

	if (provider !== undefined) existing.provider = provider;
	if (apiKey !== undefined) existing.apiKey = apiKey;
	if (model !== undefined) existing.model = model;

	writeConfig(existing);
	return existing;
}
