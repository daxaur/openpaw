---
name: c-obsidian
description: Obsidian vault as persistent memory — daily notes, session logs, knowledge capture, and search across your entire vault.
tags: [obsidian, notes, knowledge-base, memory, daily-notes]
---

# Obsidian — Knowledge Base & Memory

Manage your Obsidian vault as a persistent memory layer. Use it for daily notes, session logs, knowledge capture, and searching your second brain.

## CLI Commands

```bash
# Search before creating (avoid duplicates)
obsidian-cli search "query"
obsidian-cli search --tag "project" --folder "Work"

# Create and edit
obsidian-cli create "Title" --content "Body"
obsidian-cli create "Title" --template "Daily Note"
obsidian-cli append "Note Title" "Additional content"

# Open, list, vault
obsidian-cli open "Note Title"
obsidian-cli list --folder "Projects"
obsidian-cli tags
obsidian-cli vault --list
```

## Daily Notes Integration

When the user starts a session, check for today's daily note:

```bash
obsidian-cli search --folder "Daily Notes" "$(date +%Y-%m-%d)"
```

If none exists, create one:

```bash
obsidian-cli create "$(date +%Y-%m-%d)" --folder "Daily Notes" --content "# $(date +%Y-%m-%d)\n\n## Tasks\n\n## Notes\n\n## Session Log\n"
```

Append a session log entry at the end of each session:

```bash
obsidian-cli append "$(date +%Y-%m-%d)" "### Session $(date +%H:%M)\n- [summary of what was done]\n"
```

## Memory Sync

If both c-memory and c-obsidian are installed, keep them in sync:
- Key facts in `~/.claude/memory/MEMORY.md` should also appear in an Obsidian note (e.g., `AI/Memory.md`)
- When the user says "remember this", save to both systems
- Obsidian is the long-term archive; `~/.claude/memory/` is the quick-access cache

## Guidelines

- Always search before creating to avoid duplicate notes
- Use frontmatter tags: `tags: [project, active]`
- File paths are relative to vault root
- Obsidian app does not need to be running
- Keep daily notes in a consistent folder (default: `Daily Notes/`)
