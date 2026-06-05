import type { Provider } from "./providers";
import { getProviderConfig } from "./providers";

export async function fetchModels(
	provider: Provider,
	apiKey: string,
): Promise<string[]> {
	const config = getProviderConfig(provider, apiKey);

	const res = await fetch(config.url, {
		headers: { "Content-Type": "application/json", ...config.headers },
	});

	if (!res.ok) {
		console.log(`[${provider}] Failed: ${res.status} ${res.statusText}`);
		throw new Error(`[${provider}] Failed: ${res.status} ${res.statusText}`);
	}

	const data = await res.json();
	return config.extractModels(data);
}

export async function fetchAllModels(
	keys: Partial<Record<Provider, string>>,
): Promise<string[]> {
	const entries = Object.entries(keys) as [Provider, string][];

	const results = await Promise.allSettled(
		entries.map(([provider, apiKey]) => fetchModels(provider, apiKey)),
	);

	return results.flatMap((result, i) => {
		if (result.status === "fulfilled") return result.value;
		console.error(
			`[${entries[i]?.[0] ?? "unknown"}] Error:`,
			result.reason.message,
		);
		return [];
	});
}
