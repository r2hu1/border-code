import { ToolLoopAgent, stepCountIs, type ModelMessage } from "ai";
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

	const agent = new ToolLoopAgent({
		model,
		instructions: system,
		tools,
		stopWhen: stepCountIs(25),
	});

	const result = await agent.stream({
		messages,
	});

	let fullText = "";
	for await (const chunk of result.textStream) {
		fullText += chunk;
		onText?.(chunk);
	}

	const [reasoningParts, steps] = await Promise.all([
		result.reasoning,
		result.steps,
	]);

	const toolCalls: ToolCallData[] = [];
	for (const step of steps) {
		step.toolCalls.forEach((tc, i) => {
			const tr = step.toolResults[i];
			toolCalls.push({
				toolName: tc.toolName,
				args: tc.input as Record<string, unknown>,
				result: tr?.output,
			});
		});
	}

	const chatResult: ChatResult = {
		text: fullText,
		reasoning: reasoningParts.map((r) => r.text).join("\n") || undefined,
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
