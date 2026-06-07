import {
	streamText,
	stepCountIs,
	generateText,
	NoOutputGeneratedError,
	type ModelMessage,
} from "ai";
import {
	APICallError,
	LoadAPIKeyError,
	NoSuchModelError,
} from "@ai-sdk/provider";
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
	| "aborted"
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

const NATIVE_COMPACTION_PROVIDERS = new Set(["anthropic"]);

const CLIENT_COMPACTION_THRESHOLD: Record<string, number> = {
	openai: 100_000,
	gemini: 800_000,
	openrouter: 80_000,
	groq: 20_000,
	mistral: 30_000,
};

function messageContent(m: ModelMessage): string {
	if (typeof (m as any).content === "string") return (m as any).content;
	return JSON.stringify((m as any).content ?? "");
}

function estimateTokens(messages: ModelMessage[]): number {
	return messages.reduce(
		(acc, m) => acc + Math.ceil(messageContent(m).length / 4),
		0,
	);
}

function extractErrorMessage(body: string): string {
	try {
		const parsed = JSON.parse(body);
		if (parsed?.error?.message) return String(parsed.error.message);
		if (parsed?.error)
			return typeof parsed.error === "string"
				? parsed.error
				: JSON.stringify(parsed.error);
	} catch {}
	return "";
}

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
			message:
				"API key is missing or invalid. Check your provider configuration.",
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
				message:
					bodyMsg ||
					"Invalid API key. Check your provider API key configuration.",
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
			if (
				bodyLower.includes("token") ||
				bodyLower.includes("context length") ||
				bodyLower.includes("maximum length")
			) {
				return {
					type: "token_limit",
					message:
						bodyMsg || "Token limit exceeded. Try shortening your message.",
					retryable: false,
					raw: err,
				};
			}
			return {
				type: "model",
				message: bodyMsg || "Request failed. The model may not be available.",
				retryable: false,
				raw: err,
			};
		}

		if (status !== undefined && status >= 500) {
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
			retryable:
				status !== undefined &&
				status !== 400 &&
				status !== 401 &&
				status !== 403,
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

	const message =
		err instanceof Error ? err.message : "An unexpected error occurred.";
	return { type: "unknown", message, retryable: true, raw: err };
}

function createModelFn(provider: string, apiKey: string, modelName: string) {
	switch (provider) {
		case "openai":
			return createOpenAI({ apiKey }).chat(modelName);
		case "anthropic":
			return createAnthropic({ apiKey })(modelName);
		case "gemini":
			return createGoogleGenerativeAI({ apiKey })(modelName);
		case "openrouter":
			return createOpenAI({
				baseURL: "https://openrouter.ai/api/v1",
				apiKey,
			}).chat(modelName);
		case "groq":
			return createOpenAI({
				baseURL: "https://api.groq.com/openai/v1",
				apiKey,
			}).chat(modelName);
		case "mistral":
			return createMistral({ apiKey })(modelName);
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}

type ModelInstance = ReturnType<typeof createModelFn>;

async function compactMessages(
	messages: ModelMessage[],
	system: string,
	summaryModel: ModelInstance,
	keepLast = 20,
): Promise<{ system: string; messages: ModelMessage[] }> {
	if (messages.length <= keepLast) return { system, messages };

	const toSummarise = messages.slice(0, -keepLast);
	const recent = messages.slice(-keepLast);

	const summaryPrompt = [
		"You are a conversation summariser. Produce a concise summary of the following",
		"conversation history that preserves all important decisions, context, and facts.",
		"Reply with only the summary — no preamble.\n",
		...toSummarise.map((m) => {
			const role = (m as any).role ?? "unknown";
			return `${role}: ${messageContent(m)}`;
		}),
	].join("\n");

	const { text: summary } = await generateText({
		model: summaryModel,
		prompt: summaryPrompt,
		maxOutputTokens: 1024,
	});

	return {
		system: `${system}\n\n[CONVERSATION SUMMARY — earlier context]\n${summary}`,
		messages: recent,
	};
}

function anthropicCompactionOptions() {
	return {
		anthropic: {
			contextManagement: {
				edits: [
					{
						type: "compact_20260112" as const,
						trigger: { type: "input_tokens" as const, value: 60_000 },
						instructions:
							"Summarise the conversation concisely, preserving all key decisions, code, and context.",
						pauseAfterCompaction: false,
					},
				],
			},
		},
	};
}

export async function chat(
	options: ChatOptions,
): Promise<ChatResult | undefined> {
	const {
		messages,
		mode,
		onText,
		onToolCall,
		onFinish,
		onError,
		abortSignal,
		provider,
		model: modelName,
		apiKey,
	} = options;

	if (abortSignal?.aborted) {
		onError?.({
			type: "aborted",
			message: "Request was aborted.",
			retryable: false,
		});
		return undefined;
	}

	const model = createModelFn(provider, apiKey, modelName);
	const system = buildSystemPrompt({ mode });
	const tools = getToolForMode(mode);

	const isNative = NATIVE_COMPACTION_PROVIDERS.has(provider);
	const clientThreshold = CLIENT_COMPACTION_THRESHOLD[provider];

	const streamResult = streamText({
		model,
		system,
		messages,
		tools,
		stopWhen: stepCountIs(25),
		abortSignal,

		...(isNative && { providerOptions: anthropicCompactionOptions() }),

		...(!isNative &&
			clientThreshold !== undefined && {
				prepareStep: async ({ messages: stepMessages, stepNumber }) => {
					if (stepNumber === 0) return {};
					if (estimateTokens(stepMessages) < clientThreshold) return {};
					return compactMessages(stepMessages, system, model);
				},
			}),

		onStepFinish({ toolCalls: stepToolCalls, toolResults: stepToolResults }) {
			if (!stepToolCalls.length) return;
			const calls: ToolCallData[] = stepToolCalls.map((tc, i) => ({
				toolName: tc.toolName,
				args: tc.input as Record<string, unknown>,
				result: stepToolResults[i]?.output,
			}));
			onToolCall?.(calls);
		},
		onChunk({ chunk }) {
			if (chunk.type === "tool-call") {
				onToolCall?.([
					{
						toolName: chunk.toolName,
						args: chunk.input as Record<string, unknown>,
					},
				]);
			}
		},
	});

	let fullText = "";

	try {
		for await (const chunk of streamResult.textStream) {
			if (abortSignal?.aborted) break;
			fullText += chunk;
			onText?.(chunk);
		}
	} catch (err) {
		if (
			abortSignal?.aborted ||
			(err instanceof Error && err.name === "AbortError")
		) {
			onError?.({
				type: "aborted",
				message: "Request was aborted.",
				retryable: false,
				raw: err,
			});
			return undefined;
		}
		onError?.(normalizeError(err));
		return undefined;
	}

	let reasoningText: string | undefined;
	let steps: Awaited<typeof streamResult.steps>;

	try {
		[reasoningText, steps] = await Promise.all([
			streamResult.reasoning.then(
				(parts) => parts.map((r) => r.text).join("\n") || undefined,
			),
			streamResult.steps,
		]);
	} catch (err) {
		if (
			abortSignal?.aborted ||
			(err instanceof Error && err.name === "AbortError")
		) {
			onError?.({
				type: "aborted",
				message: "Request was aborted.",
				retryable: false,
				raw: err,
			});
			return undefined;
		}
		onError?.(normalizeError(err));
		return undefined;
	}

	const allToolCalls: ToolCallData[] = steps.flatMap((step) =>
		step.toolCalls.map((tc, i) => ({
			toolName: tc.toolName,
			args: tc.input as Record<string, unknown>,
			result: step.toolResults[i]?.output,
		})),
	);

	const chatResult: ChatResult = {
		text: fullText,
		reasoning: reasoningText,
		toolCalls: allToolCalls,
	};

	try {
		await onFinish?.(chatResult);
	} catch (err) {
		onError?.(normalizeError(err));
		return undefined;
	}

	return chatResult;
}
