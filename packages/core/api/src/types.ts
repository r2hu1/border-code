import type { ModeType } from "@border-code/shared";

export interface ToolCall {
	toolName: string;
	args: Record<string, unknown>;
	result?: unknown;
}

export interface Message {
	role: "user" | "agent";
	content: string;
	mode: ModeType;
	reasoning?: string;
	toolCalls?: ToolCall[];
	status?: "streaming" | "completed" | "error" | "aborted";
}

export type Session = {
	id: string;
	title: string;
	cwd: string;
	mode: ModeType;
	messages: Message[];
	status: "streaming" | "completed" | "error" | "aborted" | null;
	createdAt: Date;
	updatedAt: Date;
};

export type Config = {
	id: string;
	provider: string | null;
	apiKey: string | null;
	model: string | null;
};
