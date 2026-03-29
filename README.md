# markplane-memory

Structured task-oriented memory for AI agents via [Markplane](https://github.com/zerowand01/markplane).

This OpenClaw plugin injects Markplane's compressed project state into the agent's system prompt on every turn — no tool calls, no instructions that get lost to compaction. Your agent knows what's in progress, what's blocked, and what's next before it reads a single message.

## Why Markplane for agent memory

| Capability | OpenClaw today | With Markplane |
|---|---|---|
| Structure | Prose daily logs | Typed items with YAML frontmatter |
| Compression | MEMORY.md (hand-curated, unbounded) | .context/summary.md (~1000 tokens, generated) |
| Retrieval | Vector search over all files | INDEX.md routing — load only relevant items |
| Relationships | None (text similarity only) | `depends_on`, `blocks`, `related`, `[[ID]]` cross-refs |
| Status tracking | None | `draft → backlog → planned → in-progress → done` |
| Prioritization | None | `critical / high / medium / low` with sorted context |
| AI tool access | `memory_search` (semantic) | Full MCP server (query, show, add, update, sync) |

Markplane complements, not replaces, OpenClaw's existing memory:

| System | What it stores | Keep using? |
|--------|---------------|-------------|
| `MEMORY.md` | Identity, preferences, curated long-term context | Yes |
| `memory/YYYY-MM-DD.md` | Daily logs, session transcripts | Yes |
| `.markplane/` | Structured tasks, decisions, project state | New |

Daily logs capture what happened. Markplane captures what needs to happen.

## What the plugin does

- **Injects `.context/summary.md` into the system prompt** via the `before_prompt_build` hook. The agent sees a ~1000-token project overview on every turn, automatically.
- **Bundles a SKILL.md** that teaches the agent how to use Markplane (item types, MCP tools, what's worth capturing).
- **Configurable** — choose which context files to inject and customize the header.

## Quick start

### 1. Install Markplane

See the [Markplane installation guide](https://github.com/zerowand01/markplane#installation) for options (Homebrew, shell script, pre-built binary, or build from source).

### 2. Initialize in the OpenClaw workspace

```bash
cd ~/.openclaw/workspace
markplane init --name "Agent Memory" --empty
```

The `--empty` flag skips starter content (sample tasks, etc.) that would clutter the agent's context with irrelevant onboarding material.

### 3. Install the plugin

```bash
openclaw plugins install @zerowand/markplane-memory
```

### 4. Register the MCP server

Add an `mcp.servers` entry to `~/.openclaw/openclaw.json`. The `--project` flag is required because the gateway's working directory isn't your workspace, so markplane can't auto-discover `.markplane/`:

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

If your workspace is at a non-default location, replace `~/.openclaw/workspace` with your actual `agents.defaults.workspace` path.

### 5. Restart the gateway

```bash
openclaw gateway restart
```

If existing chat sessions don't pick up the plugin after restart, send `/new` to start a fresh session.

### Verify it works

1. Ask your agent: "Do you see a Task Memory or Markplane section in your system prompt?" — the agent can confirm it sees the injected context
2. Check that `markplane` appears in the agent's skills list (ask the agent, or check the Skills page in the web UI)
3. Ask the agent to run `markplane_summary` to confirm MCP tools are working

## Web UI

Markplane includes a local web dashboard — a visual interface for your agent's structured memory. Browse tasks on a kanban board, view the dependency graph, track epic progress, and manage the same items your agent works with:

```bash
cd ~/.openclaw/workspace    # or wherever you ran markplane init
markplane serve --open
```

> **Note:** Markplane stores data in a `.markplane/` directory (hidden by default on macOS/Linux). Use `ls -a` or enable hidden files in your file manager to see it.

See the [Markplane Web UI Guide](https://github.com/zerowand01/markplane/blob/master/docs/web-ui-guide.md) for details.

## How it works

Markplane generates compressed, AI-readable summaries in `.markplane/.context/`:

- `summary.md` — project overview with active epics, blocked items, priority queue, and metrics (~1000 tokens)
- `active-work.md` — currently in-progress tasks with details
- `blocked-items.md` — items with unresolved dependencies
- `metrics.md` — item counts by status and priority

The plugin reads these files and appends them to the system prompt via the `before_prompt_build` lifecycle hook. By default, only `summary.md` is injected. The MCP server provides typed tools for creating and updating items.

## Configuration

Configure in `~/.openclaw/openclaw.json` under `plugins.entries.@zerowand/markplane-memory.config`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `contextFiles` | `string[]` | `["summary.md"]` | Which `.context/` files to inject. Options: `summary.md`, `active-work.md`, `blocked-items.md`, `metrics.md` |
| `contextHeader` | `string` | `"## Task Memory (Markplane)"` | Header text prepended to injected context |

Example — inject both the summary and active work:

```json
{
  "plugins": {
    "entries": {
      "@zerowand/markplane-memory": {
        "config": {
          "contextFiles": ["summary.md", "active-work.md"]
        }
      }
    }
  }
}
```

## Optional: Compaction flush prompt

By default, OpenClaw's pre-compaction flush writes to daily log files. You can extend it to also structure items into Markplane before context is compressed. This overwrites the default flush prompt — review it before applying:

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

## Manual setup (without the plugin)

If you prefer not to use the plugin, you can set up Markplane manually. The trade-off: without the plugin, context injection relies on an instruction in `AGENTS.md` that can be lost during compaction.

1. Install Markplane and run `markplane init` in your workspace (same as above)
2. Register the MCP server in `openclaw.json` (same as above)
3. Add to `~/.openclaw/workspace/AGENTS.md`:

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

| | Plugin | Manual |
|---|---|---|
| Install | `openclaw plugins install @zerowand/markplane-memory` | Edit 2 config files + AGENTS.md |
| Context injection | Automatic every turn via `before_prompt_build` | Relies on AGENTS.md (can be lost to compaction) |
| MCP server | Requires `mcp.servers` config entry | Same |
| Compaction flush | Optional `memoryFlush` config edit | Same |
| SKILL.md | Bundled, auto-appears in skill list | Must manually create |
| Survives compaction | Yes — system prompt injection is outside conversation history | No — competes with conversation history |

## License

Apache-2.0
