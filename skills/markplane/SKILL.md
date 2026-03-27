---
name: markplane
description: "Structured task-oriented memory via Markplane. Use when working with tasks, project state, or when you need to capture decisions and action items."
---

# Markplane — Structured Task Memory

This workspace uses Markplane for structured, task-oriented memory.
Markplane stores tasks, epics, plans, and notes as markdown files in
`.markplane/` with compressed AI-readable summaries in `.context/`.

## Reading project state

The compressed summary is already in your system prompt (injected
automatically). For deeper detail:

1. Read `.markplane/.context/summary.md` for current project overview
2. Read `.markplane/.context/active-work.md` for in-progress items
3. Read `.markplane/.context/blocked-items.md` for blocked items
4. Read `.markplane/backlog/INDEX.md` to browse all tasks
5. Read specific items by ID: `.markplane/backlog/items/TASK-xxxxx.md`

## Working with items

Markplane items are markdown files with YAML frontmatter. You can
read and write these files directly — especially the free-form
markdown body below the frontmatter, which is where detailed context,
notes, and implementation details belong.

**Use MCP tools for structural operations:**

- `markplane_add` — create a new item (generates ID, scaffolds template)
- `markplane_update` — change frontmatter fields (status, priority, assignee, etc.)
- `markplane_link` — manage cross-references (depends_on, blocks, related) and sync them in frontmatter
- `markplane_query` — find items by status, priority, type, tags
- `markplane_show` — read full item details by ID
- `markplane_sync` — regenerate INDEX.md and .context/ summaries

**Read and edit files directly for content:**

After creating an item with `markplane_add`, edit the markdown body
directly to add context, notes, acceptance criteria, or any free-form
detail. The MCP tools manage structure (IDs, frontmatter, cross-refs);
you manage content.

Always run `markplane_sync` after creating or updating items so the
context summaries reflect the latest state.

## Examples of what's worth capturing

Use judgment about what deserves a structured item vs. what belongs
in the daily log or conversation. Some examples:

- "We need to migrate the database before launch" -> task with priority
  and a dependency on the schema design task
- "We decided to use PostgreSQL over SQLite for the API" -> note
  (type: decision) with reasoning in the body
- "The deployment pipeline should do X, then Y, then Z" -> plan with
  steps and linked tasks for each phase
- "Ship the v2 API by end of Q2" -> epic with related tasks underneath
- "The client's timezone is UTC+9, they prefer async communication" ->
  this probably belongs in MEMORY.md, not Markplane — it's a preference,
  not a task

Not everything needs to be an item. If it's actionable, trackable,
or a decision worth referencing later, it's a good candidate. If it's
ephemeral context or a quick answer, let it live in the conversation.

## Item types

| Prefix | Type | Directory | Use for |
|--------|------|-----------|---------|
| EPIC   | Epic | roadmap/  | Long-term goals and themes |
| TASK   | Task | backlog/  | Action items, to-dos, bugs |
| PLAN   | Plan | plans/    | Multi-step implementation approaches |
| NOTE   | Note | notes/    | Decisions, research, reference info |

## Cross-references

Use `[[TASK-xxxxx]]` wiki-style links to connect related items.
Use `depends_on` and `blocks` in frontmatter for dependency tracking
(managed via `markplane_link`).

## Coexistence with OpenClaw memory

Markplane complements, not replaces, OpenClaw's existing memory:
- `MEMORY.md` — identity, preferences, curated long-term context (keep using)
- `memory/YYYY-MM-DD.md` — daily logs, session transcripts (keep using)
- `.markplane/` — structured tasks, decisions, project state (Markplane)

Daily logs capture what happened. Markplane captures what needs to happen.
