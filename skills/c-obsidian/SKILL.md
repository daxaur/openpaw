---
name: c-obsidian
description: Interact with an Obsidian vault from the CLI using obsidian-cli. Open notes, search vault content, create and edit notes, manage tags, and navigate the knowledge graph.
tags: [obsidian, notes, knowledge-base, obsidian-cli, markdown]
---

This skill manages an Obsidian vault using the `obsidian-cli` tool.

## Common Commands

```bash
# Opening and viewing
obsidian-cli open "Note Title"           # Open a note in Obsidian
obsidian-cli open --path "folder/note"   # Open by relative vault path

# Searching
obsidian-cli search "query"              # Full-text search across vault
obsidian-cli search --tag "project"      # Search by tag
obsidian-cli search --folder "Work"      # Search within a folder

# Creating and editing
obsidian-cli create "Title" --content "Body"
obsidian-cli create "Title" --template "Daily Note"
obsidian-cli append "Note Title" "Additional content"
obsidian-cli prepend "Note Title" "Prepend this"

# Listing
obsidian-cli list                        # List all notes
obsidian-cli list --folder "Projects"    # List notes in folder
obsidian-cli list --tag "inbox"          # List notes with tag
obsidian-cli tags                        # List all tags in vault

# Vault info
obsidian-cli vault                       # Show current vault info
obsidian-cli vault --list                # List all known vaults
obsidian-cli vault --switch "Work Vault" # Switch active vault
```

## Usage Guidelines

- Prefer `obsidian-cli search` before creating to avoid duplicate notes.
- Frontmatter tags use `#tag` syntax or YAML `tags: [tag]` in markdown.
- The vault path is configured via `obsidian-cli` settings or `~/.obsidian-cli/config`.
- If the tool is missing, suggest installing the OpenPaw c-obsidian skill.

## Notes

- Obsidian app does not need to be open for CLI operations.
- File paths are relative to vault root.
