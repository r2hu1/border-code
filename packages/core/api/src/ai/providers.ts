export const PROVIDERS = [
	"openai",
	"anthropic",
	"gemini",
	"openrouter",
	"groq",
	"mistral",
];

export type Provider = (typeof PROVIDERS)[number];

interface ProviderConfig {
	url: string;
	headers: Record<string, string>;
	extractModels: (data: any) => string[];
}

export function getProviderConfig(
	provider: Provider,
	apiKey: string,
): ProviderConfig {
	switch (provider) {
		case "openai":
			return {
				url: "https://api.openai.com/v1/models",
				headers: { Authorization: `Bearer ${apiKey}` },
				extractModels: (data) => data.data.map((m: any) => m.id),
			};

		case "anthropic":
			return {
				url: "https://api.anthropic.com/v1/models",
				headers: {
					"x-api-key": apiKey,
					"anthropic-version": "2023-06-01",
				},
				extractModels: (data) => data.data.map((m: any) => m.id),
			};

		case "gemini":
			return {
				url: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
				headers: {},
				extractModels: (data) =>
					data.models
						.map((m: any) => m.name.replace("models/", ""))
						.filter((id: string) => id.startsWith("gemini")),
			};

		case "openrouter":
			return {
				url: "https://openrouter.ai/api/v1/models",
				headers: { Authorization: `Bearer ${apiKey}` },
				extractModels: (data) =>
					data.data
						.filter((m: any) => m.supported_parameters.includes("tools"))
						.map((m: any) => m.id),
			};

		case "groq":
			return {
				url: "https://api.groq.com/openai/v1/models",
				headers: { Authorization: `Bearer ${apiKey}` },
				extractModels: (data) => data.data.map((m: any) => m.id),
			};

		case "mistral":
			return {
				url: "https://api.mistral.ai/v1/models",
				headers: { Authorization: `Bearer ${apiKey}` },
				extractModels: (data) =>
					data.data
						.filter(
							(m: any) =>
								m.capabilities.function_calling === true &&
								m.capabilities.reasoning === true,
						)
						.map((m: any) => m.id),
			};
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}
