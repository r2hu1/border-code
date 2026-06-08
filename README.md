# Border Code

An open-source on-device coding agent that runs entirely in your terminal.
![Preview](assets/prev.png)

## Features

- **AI-powered coding assistant** — automated code writing, editing, and research
- **Dual modes**: `PLAN` (read-only analysis) and `BUILD` (full read/write/execute)
- **Multi-step tool agent** — uses `ToolLoopAgent` to autonomously read, write, edit files and run commands until the task is done (up to 25 steps)
- **Multiple LLM providers**: OpenAI, Anthropic (Claude), Google Gemini, OpenRouter, Groq, Mistral
- **7 local tools**: `readFile`, `listDirectory`, `glob`, `grep`, `writeFile`, `editFile`, `bash` — all sandboxed to your project directory
- **Persistent sessions** — conversation history stored locally via SQLite (Drizzle ORM)
- **31 themes** — Nightfox, Catppuccin, Dracula, Tokyo Night, Nord, and many more
- **Terminal UI** — built with OpenTUI with mouse support, scrollable messages, dialogs, and toast notifications
- **Theme persistence** — saved to `~/.border-code/preferences.json`
- **Command palette** — `Shift+Tab` to open quick actions

## Upcoming

- **Remote control** — manage Border Code from your phone or tablet via a web API
- **Web session** — expose the agent interface as a web app for browser-based use

## Install

### Standalone App

#### macOS / Linux
```bash
curl -fsSL https://raw.githubusercontent.com/r2hu1/border-code/main/scripts/install.sh | bash
```

#### Windows (PowerShell)
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; iwr https://raw.githubusercontent.com/r2hu1/border-code/main/scripts/install.ps1 -UseBasicParsing | iex
```

## Quick Start (from source)

### Prerequisites

- [Bun](https://bun.sh/) 1.x or later

### Setup

```bash
# Clone and install
git clone https://github.com/r2hu1/border-code
cd border-code
bun install

# Run the CLI
bun run dev:cli
```

### Configure an LLM Provider

1. Open the command palette (`Shift+Tab`)
2. Select **LLM Providers**
3. Choose a provider (e.g. OpenAI, Anthropic)
4. Enter your API key
5. Choose a model

## Usage

| Key            | Action                       |
| -------------- | ---------------------------- |
| `Tab`          | Toggle mode (PLAN / BUILD)   |
| `Shift+Tab`    | Open command palette         |
| `Enter`        | Submit prompt                |
| `Shift+Enter`  | New line                     |
| `/` (at start) | Open command palette         |
| `Esc`          | Close dialog / interrupt     |
| Mouse          | Click items, scroll messages |

### Modes

**PLAN** — the agent can only read files and search the codebase. Use this to ask questions, review code, or plan changes.

**BUILD** — the agent gets full read/write/execute access. It can edit files, create new ones, and run shell commands.

## Project Structure

```
border-code/
├── packages/
│   ├── cli/              # Terminal UI app (OpenTUI + React)
│   ├── core/api/         # Core engine (AI, DB, config, tools)
│   └── shared/           # Shared types and schemas
├── local.db              # SQLite database (gitignored)
└── assets/               # Screenshots
```

## Themes

Browse and select themes via the command palette. All 31 themes are defined in `packages/cli/src/themes/presets.ts` and include: Nightfox (default), Catppuccin Mocha, Dracula, Monokai Pro, Tokyo Night, Nord, Synthwave, One Dark, Gruvbox Dark, Rose Pine, Kanagawa, GitHub Dark, and more.

## Scripts

```bash
bun run dev:cli       # Run in watch mode with hot-reload
bun run format        # Format code with Biome
bun run lint          # Lint code with Biome
bun run db:generate   # Generate Drizzle migrations
bun run db:migrate    # Apply migrations
bun run db:push       # Push schema changes
```

## Contributing

Contributions are welcome! Open an issue or submit a pull request.

- Code is formatted with Biome (tabs, double quotes).
- The codebase uses TypeScript throughout.
- UI components use OpenTUI's React JSX (import `@opentui/react`).

## License

MIT
