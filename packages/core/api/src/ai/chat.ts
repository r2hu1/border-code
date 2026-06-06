import { streamText, type ModelMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { getConfig } from "../config";
import { buildSystemPrompt } from "./system-prompt";
import { getToolForMode } from "./tools";
import type { ModeType } from "@border-code/shared";

export type ToolCallData = {
	toolName: string;
	args: Record<string, unknown>;
	result?: unknown;
};

export type ChatResult = {
	text: string;
	reasoning?: string;
	toolCalls: ToolCallData[];
};

export type ChatOptions = {
	messages: Array<ModelMessage>;
	mode: ModeType;
	onText?: (chunk: string) => void;
	onFinish?: (result: ChatResult) => void | Promise<void>;
};

export async function chat(options: ChatOptions) {
	const { messages, mode, onText, onFinish } = options;
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

	const result = streamText({
		model,
		system,
		messages,
		...tools,
	});

	let fullText = "";
	if (onText) {
		for await (const chunk of result.textStream) {
			fullText += chunk;
			onText(chunk);
		}
	}

	const [reasoningText, rawToolCalls, rawToolResults] = await Promise.all([
		result.reasoningText,
		result.toolCalls,
		result.toolResults,
	]);

	const toolCalls: ToolCallData[] = rawToolCalls.map(
		(tc: unknown, i: number) => {
			const call = tc as { toolName: string; args: Record<string, unknown> };
			const res = rawToolResults[i] as { result?: unknown } | undefined;
			return { toolName: call.toolName, args: call.args, result: res?.result };
		},
	);

	const chatResult: ChatResult = {
		text: onText ? fullText : (await result.text),
		reasoning: reasoningText ?? undefined,
		toolCalls,
	};

	await onFinish?.(chatResult);

	return chatResult;
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
