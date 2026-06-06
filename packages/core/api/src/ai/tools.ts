import { tool } from "ai";
import { z } from "zod";
import { executeLocalTool } from "./local-tools";
import { Mode } from "@border-code/shared";

export const readFileTool = tool({
  description:
    "Read the contents of a file inside the project directory. " +
    "Files larger than 10 000 chars are automatically truncated.",
  inputSchema: z.object({
    path: z.string().describe("Relative path to the file (e.g. src/index.ts)"),
  }),
  execute: async (input) =>
    executeLocalTool("readFile", input, Mode.BUILD) as Promise<
      { content: string; truncated?: boolean; totalLength?: number }
    >,
});

export const listDirectoryTool = tool({
  description:
    "List the files and sub-directories inside a directory. " +
    "Hidden entries and node_modules are always excluded.",
  inputSchema: z.object({
    path: z
      .string()
      .default(".")
      .describe("Relative path to the directory to list"),
  }),
  execute: async (input) =>
    executeLocalTool("listDirectory", input, Mode.BUILD) as Promise<{
      path: string;
      entries: { name: string; type: "file" | "directory" }[];
    }>,
});

export const globTool = tool({
  description:
    "Find files matching a glob pattern inside the project. " +
    "Returns up to 200 results sorted alphabetically.",
  inputSchema: z.object({
    pattern: z
      .string()
      .describe('Glob pattern to match (e.g. "**/*.ts", "src/**/*.test.*")'),
    path: z
      .string()
      .default(".")
      .describe("Root directory to scan (default: project root)"),
  }),
  execute: async (input) =>
    executeLocalTool("glob", input, Mode.BUILD) as Promise<{
      files: string[];
      truncated?: boolean;
    }>,
});

export const grepTool = tool({
  description:
    "Search for a regex pattern across files in the project using grep. " +
    "Returns up to 50 matches with file path, line number, and matching content.",
  inputSchema: z.object({
    pattern: z
      .string()
      .describe("Extended regular expression to search for (ERE syntax)"),
    path: z
      .string()
      .default(".")
      .describe("Directory to search in (default: project root)"),
    include: z
      .string()
      .optional()
      .describe('Optional filename glob to restrict search (e.g. "*.ts")'),
  }),
  execute: async (input) =>
    executeLocalTool("grep", input, Mode.BUILD) as Promise<{
      matches: { file: string; line: number; content: string }[];
      truncated?: boolean;
      totalMatches?: number;
      message?: string;
    }>,
});

export const writeFileTool = tool({
  description:
    "Write (create or overwrite) a file inside the project directory. " +
    "Intermediate directories are created automatically.",
  inputSchema: z.object({
    path: z.string().describe("Relative path where the file should be written"),
    content: z.string().describe("Full UTF-8 content to write"),
  }),
  execute: async (input) =>
    executeLocalTool("writeFile", input, Mode.BUILD) as Promise<{
      success: true;
      path: string;
      bytesWritten: number;
    }>,
});

// ─── editFile ────────────────────────────────────────────────────────────────

export const editFileTool = tool({
  description:
    "Replace an exact, unique string in an existing file. " +
    "Fails if oldString is not found or appears more than once — " +
    "use a longer, unique context to disambiguate.",
  inputSchema: z.object({
    path: z.string().describe("Relative path to the file to edit"),
    oldString: z
      .string()
      .describe("The exact string to find — must appear exactly once"),
    newString: z
      .string()
      .describe("The string that will replace oldString (may be empty to delete)"),
  }),
  execute: async (input) =>
    executeLocalTool("editFile", input, Mode.BUILD) as Promise<{
      success: true;
      path: string;
    }>,
});

export const bashTool = tool({
  description:
    "Execute an arbitrary bash command inside the project directory. " +
    "stdout and stderr are each capped at 20 000 chars. " +
    "Use the timeout option for long-running commands (default 30 s).",
  inputSchema: z.object({
    command: z.string().describe("The bash command to run"),
    timeout: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Timeout in milliseconds (default: 30 000)"),
  }),
  execute: async (input) =>
    executeLocalTool("bash", input, Mode.BUILD) as Promise<{
      stdout: string;
      stderr: string;
      exitCode: number;
    }>,
});

export const readOnlyTools = {
  readFile: readFileTool,
  listDirectory: listDirectoryTool,
  glob: globTool,
  grep: grepTool,
} as const;

export const allTools = {
  ...readOnlyTools,
  writeFile: writeFileTool,
  editFile: editFileTool,
  bash: bashTool,
} as const;
