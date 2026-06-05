export const PROVIDERS = [
	"openai",
	"anthropic",
	"google",
	"xai",
	"openrouter",
	"groq",
	"mistral",
	"deepseek",
];

export type Provider = (typeof PROVIDERS)[number];
