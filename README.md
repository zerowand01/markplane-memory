# markplane-memory

Structured task-oriented memory for AI agents via [Markplane](https://github.com/zerowand01/markplane).

This OpenClaw plugin injects Markplane's compressed project state into the agent's system prompt on every turn — no tool calls, no instructions that get lost to compaction. The agent always knows current project state.

## What it does

- **Injects `.context/summary.md` into the system prompt** via the `before_prompt_build` hook. The agent sees a ~1000-token project overview on every turn, automatically.
- **Bundles a SKILL.md** that teaches the agent how to use Markplane (item types, MCP tools, what's worth capturing).
- **Configurable** — choose which context files to inject and customize the header.

## Prerequisites

1. **Markplane** installed on your system — see the [Markplane installation guide](https://github.com/zerowand01/markplane#installation) for options (Homebrew, shell script, pre-built binary, or build from source).

2. **Markplane initialized** in your OpenClaw workspace:
   ```bash
   cd ~/.openclaw/workspace
   markplane init --name "Agent Memory" --empty
   ```

## Installation

```bash
openclaw plugins install markplane-memory
```

## Setup

The plugin handles context injection automatically. You still need two manual config edits in `~/.openclaw/openclaw.json`:

### Register the MCP server

Add an `mcp.servers` entry. The `--project` flag is required because the gateway's working directory isn't your workspace, so markplane can't auto-discover `.markplane/`:

```json
{
  "mcp": {
    "servers": {
      "markplane": {
        "command": "markplane",
        "args": ["mcp", "--project", "~/.openclaw/workspace"],
        "transport": "stdio"
      }
    }
  }
}
```

This gives the agent access to Markplane's tools (`markplane_add`, `markplane_query`, `markplane_update`, etc.).

### Update the compaction flush prompt

This tells the agent to structure its memories into Markplane before context is compressed:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "enabled": true,
          "systemPrompt": "Session nearing compaction. Store durable memories now. Also use Markplane MCP tools to capture any tasks, decisions, or knowledge worth structuring.",
          "prompt": "Write any lasting notes to memory/YYYY-MM-DD.md. Then use markplane_add to capture any new tasks or decisions, and markplane_update for any status changes. Run markplane_sync when done. Reply with NO_REPLY if nothing to store."
        }
      }
    }
  }
}
```

### Restart the gateway

```bash
openclaw gateway restart
```

## Verifying it works

1. Send any message to your agent
2. Run `/context list` in the chat
3. Look for the `## Task Memory (Markplane)` section in the system prompt
4. The summary content should appear without the agent making any tool calls

## Configuration

Configure in `~/.openclaw/openclaw.json` under `plugins.entries.markplane-memory.config`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `contextFiles` | `string[]` | `["summary.md"]` | Which `.context/` files to inject. Options: `summary.md`, `active-work.md`, `blocked-items.md`, `metrics.md` |
| `contextHeader` | `string` | `"## Task Memory (Markplane)"` | Header text prepended to injected context |

Example — inject both the summary and active work:

```json
{
  "plugins": {
    "entries": {
      "markplane-memory": {
        "config": {
          "contextFiles": ["summary.md", "active-work.md"]
        }
      }
    }
  }
}
```

## Manual setup (without the plugin)

If you prefer not to use the plugin, you can set up Markplane manually. The trade-off: without the plugin, context injection relies on an instruction in `AGENTS.md` that can be lost during compaction.

1. Install Markplane and run `markplane init` in your workspace (same as above)
2. Register the MCP server in `openclaw.json` (same as above)
3. Update the compaction flush prompt (same as above)
4. Add to `~/.openclaw/workspace/AGENTS.md`:

```markdown
## Task Memory (Markplane)

This workspace uses Markplane for structured task memory in `.markplane/`.

At the start of each session, read `.markplane/.context/summary.md` to
understand current project state. Use Markplane MCP tools (markplane_query,
markplane_add, markplane_update, markplane_sync) to manage tasks.

When decisions are made or action items identified, capture them as
Markplane items. Always run markplane_sync after changes.
```

**Why the plugin is better:** The `AGENTS.md` instruction lives inside the context window and competes with conversation history during compaction — it can be summarized away. The plugin injects context into the system prompt, outside the conversation history, guaranteed on every turn.

## What this plugin does NOT do

- **Does not replace `memory-core`** — it complements OpenClaw's existing memory
- **Does not bundle the Markplane binary** — requires separate installation
- **Does not auto-run `markplane init`** — you initialize manually
- **Does not auto-configure the MCP server** — you add the `mcp.servers` entry
- **Does not modify the compaction flush prompt** — you update `memoryFlush` config

## How it works

Markplane stores project data as markdown files in `.markplane/` and generates compressed, AI-readable summaries in `.markplane/.context/`. The plugin reads these context files and appends them to the system prompt via the `before_prompt_build` lifecycle hook.

The agent gets structured project state (tasks, epics, blockers, priorities) without spending tool calls. The MCP server provides typed tools for creating and updating items. The compaction flush prompt ensures the agent structures its knowledge before context is compressed.

Daily logs capture what happened. Markplane captures what needs to happen.

## License

Apache-2.0
