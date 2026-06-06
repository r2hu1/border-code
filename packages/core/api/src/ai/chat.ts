import { streamText, stepCountIs, NoOutputGeneratedError, type ModelMessage } from "ai";
import { APICallError, LoadAPIKeyError, NoSuchModelError } from "@ai-sdk/provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
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

export type ChatErrorType =
	| "api_key"
	| "rate_limit"
	| "token_limit"
	| "model"
	| "no_output"
	| "provider"
	| "network"
	| "unknown";

export type ChatError = {
	type: ChatErrorType;
	message: string;
	retryable: boolean;
	raw?: unknown;
};

export type ChatOptions = {
	messages: Array<ModelMessage>;
	mode: ModeType;
	onText?: (chunk: string) => void;
	onToolCall?: (toolCalls: ToolCallData[]) => void;
	onFinish?: (result: ChatResult) => void | Promise<void>;
	onError?: (error: ChatError) => void;
	abortSignal?: AbortSignal;
	provider: string;
	model: string;
	apiKey: string;
};

function normalizeError(err: unknown): ChatError {
	if (err instanceof NoOutputGeneratedError) {
		return {
			type: "no_output",
			message: "No response was generated. Try rephrasing your request.",
			retryable: true,
			raw: err,
		};
	}

	if (err instanceof LoadAPIKeyError) {
		return {
			type: "api_key",
			message: "API key is missing or invalid. Check your provider configuration.",
			retryable: false,
			raw: err,
		};
	}

	if (err instanceof NoSuchModelError) {
		return {
			type: "model",
			message: `Model not found: ${err.message}. Check your model configuration.`,
			retryable: false,
			raw: err,
		};
	}

	if (APICallError.isInstance(err)) {
		const status = err.statusCode;
		const body = err.responseBody ?? "";
		const bodyMsg = extractErrorMessage(body);

		if (status === 401 || status === 403) {
			return {
				type: "api_key",
				message: bodyMsg || "Invalid API key. Check your provider API key configuration.",
				retryable: false,
				raw: err,
			};
		}

		if (status === 429) {
			return {
				type: "rate_limit",
				message: bodyMsg || "Rate limit exceeded. Wait a moment and try again.",
				retryable: true,
				raw: err,
			};
		}

		if (status === 400) {
			const bodyLower = body.toLowerCase();
			if (bodyLower.includes("token") || bodyLower.includes("context length") || bodyLower.includes("maximum length")) {
				return {
					type: "token_limit",
					message: bodyMsg || "Token limit exceeded. Try shortening your message.",
					retryable: true,
					raw: err,
				};
			}
			return {
				type: "model",
				message: bodyMsg || `Request failed. The model may not be available.`,
				retryable: false,
				raw: err,
			};
		}

		if (status && status >= 500) {
			return {
				type: "provider",
				message: bodyMsg || "Provider server error. Try again later.",
				retryable: true,
				raw: err,
			};
		}

		return {
			type: "unknown",
			message: bodyMsg || err.message || "An API error occurred.",
			retryable: status !== undefined && status !== 400 && status !== 401 && status !== 403,
			raw: err,
		};
	}

	if (err instanceof TypeError && err.message === "fetch failed") {
		return {
			type: "network",
			message: "Network error. Check your internet connection.",
			retryable: true,
			raw: err,
		};
	}

	const message = err instanceof Error ? err.message : "An unexpected error occurred.";
	return {
		type: "unknown",
		message,
		retryable: true,
		raw: err,
	};
}

function extractErrorMessage(body: string): string {
	try {
		const parsed = JSON.parse(body);
		if (parsed?.error?.message) return parsed.error.message;
		if (parsed?.error) return typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error);
	} catch {}
	return "";
}

export async function chat(options: ChatOptions) {
	const {
		messages,
		mode,
		onText,
		onFinish,
		onError,
		abortSignal,
		provider,
		model: modelName,
		apiKey,
	} = options;

	const model = createModel(provider, apiKey, modelName);
	const system = buildSystemPrompt({ mode });
	const tools = getToolForMode(mode);

	const result = streamText({
		model,
		system,
		messages,
		tools,
		stopWhen: stepCountIs(25),
		abortSignal,
		onStepFinish({ toolCalls: stepToolCalls, toolResults: stepToolResults }) {
			if (stepToolCalls.length === 0) return;
			const calls: ToolCallData[] = stepToolCalls.map((tc, i) => ({
				toolName: tc.toolName,
				args: tc.input as Record<string, unknown>,
				result: stepToolResults[i]?.output,
			}));
			onToolCall?.(calls);
		},
	});

	let fullText = "";
	const allToolCalls: ToolCallData[] = [];

	try {
		for await (const chunk of result.textStream) {
			fullText += chunk;
			onText?.(chunk);
		}
	} catch (err) {
		if (abortSignal?.aborted) {
			const reason = abortSignal.reason;
			if (reason instanceof Error && reason.name === "AbortError") {
				throw reason;
			}
		}
		const normalized = normalizeError(err);
		onError?.(normalized);
		return;
	}

	const [reasoningParts, steps] = await Promise.all([
		result.reasoning,
		result.steps,
	]);

	for (const step of steps) {
		step.toolCalls.forEach((tc, i) => {
			const tr = step.toolResults[i];
			allToolCalls.push({
				toolName: tc.toolName,
				args: tc.input as Record<string, unknown>,
				result: tr?.output,
			});
		});
	}

	const chatResult: ChatResult = {
		text: fullText,
		reasoning: reasoningParts.map((r) => r.text).join("\n") || undefined,
		toolCalls: allToolCalls,
	};

	await onFinish?.(chatResult);

	return chatResult;
}

function createModel(provider: string, apiKey: string, modelName: string) {
	switch (provider) {
		case "openai": {
			const openai = createOpenAI({ apiKey });
			return openai.chat(modelName);
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
			return openrouter.chat(modelName);
		}
		case "groq": {
			const groq = createOpenAI({
				baseURL: "https://api.groq.com/openai/v1",
				apiKey,
			});
			return groq.chat(modelName);
		}
		case "mistral": {
			const mistral = createMistral({ apiKey });
			return mistral(modelName);
		}
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}
