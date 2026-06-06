import { streamText, type ModelMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { getConfig } from "../config";
import { buildSystemPrompt } from "./system-prompt";
import { getToolForMode } from "./tools";
import type { ModeType } from "@border-code/shared";

export type ChatOptions = {
	messages: Array<ModelMessage>;
	mode: ModeType;
};

export async function chat(options: ChatOptions) {
	const { messages, mode } = options;
	const config = await getConfig();

	if (!config) {
		throw new Error("No config found");
	}

	const model = createModel(
		config.provider ?? "",
		config.apiKey ?? "",
		config.model ?? "",
	);
	const system = buildSystemPrompt({ mode });
	const tools = getToolForMode(mode);

	return streamText({
		model,
		system,
		messages,
		...tools,
	});
}

function createModel(
	provider: string,
	apiKey: string,
	modelName: string,
) {
	switch (provider) {
		case "openai": {
			const openai = createOpenAI({ apiKey });
			return openai(modelName);
		}
		case "anthropic": {
			const anthropic = createAnthropic({ apiKey });
			return anthropic(modelName);
		}
		case "gemini": {
			const google = createGoogleGenerativeAI({ apiKey });
			return google(modelName);
		}
		case "openrouter": {
			const openrouter = createOpenAI({
				baseURL: "https://openrouter.ai/api/v1",
				apiKey,
			});
			return openrouter(modelName);
		}
		case "groq": {
			const groq = createOpenAI({
				baseURL: "https://api.groq.com/openai/v1",
				apiKey,
			});
			return groq(modelName);
		}
		case "mistral": {
			const mistral = createMistral({ apiKey });
			return mistral(modelName);
		}
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}
