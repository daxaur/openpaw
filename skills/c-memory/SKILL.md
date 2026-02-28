---
name: c-memory
description: Persistent memory across Claude Code sessions — remember facts, preferences, and context
tags: [memory, context, persistence]
---

# Memory — Persistent Context

Store and recall facts, preferences, and context across Claude Code sessions.

## How It Works

Memory lives in `~/.claude/memory/` as plain markdown files. Read them at session start, write to them when you learn something important.

## Directory Structure

```
~/.claude/memory/
├── MEMORY.md          # Key facts — always read this first
├── people.md          # People the user mentions (names, roles, preferences)
├── preferences.md     # User preferences (tools, workflows, habits)
├── projects.md        # Active projects and their context
└── journal.md         # Session log — append-only, dated entries
```

## Session Start

At the beginning of every session, read `~/.claude/memory/MEMORY.md` to load context. This file should be concise — under 100 lines.

## When to Save

Save to memory when the user:
- Shares their name, role, or preferences
- Mentions people they work with
- Describes a project or recurring task
- Says "remember this" or "don't forget"
- Corrects you about something

## Writing Rules

- **MEMORY.md**: Key facts only. Keep under 100 lines. Update, don't append.
- **people.md**: Name, role, relationship, preferences. One section per person.
- **preferences.md**: Tools, workflows, communication preferences.
- **projects.md**: Project name, status, key files, context.
- **journal.md**: Append a dated entry at the end of each session summarizing what was done.

## Commands

```bash
# Read memory
cat ~/.claude/memory/MEMORY.md

# List memory files
ls ~/.claude/memory/

# Append to journal
echo "## $(date +%Y-%m-%d)" >> ~/.claude/memory/journal.md
```

## Example MEMORY.md

```markdown
# Memory

## User
- Name: Alex
- Role: Frontend developer
- Prefers TypeScript, uses Neovim
- Timezone: PST

## Active Projects
- ctrl.build — DeFi workflow automation (Next.js + Solidity)
- openpaw — CLI tool for Claude Code setup

## Preferences
- Concise responses, no emoji unless asked
- Always use bun instead of npm
- Dark mode everything
```

## Guidelines

- Never store passwords, API keys, or secrets in memory files
- Always ask before overwriting existing memory entries
- If memory files don't exist, create them on first write
- Keep MEMORY.md focused — move details to topic-specific files
