---
name: c
description: Main coordinator skill for OpenPaw. Routes requests to the right sub-skill, lists available skills, and helps install missing ones. Use /c for any task when you're unsure which skill to invoke.
tags: [coordinator, routing, skills, meta]
---

The `/c` skill is the central router for all OpenPaw skills. When a user makes a request, identify the best skill and invoke it, or suggest installing it if unavailable.

## Available Skill Categories (23 total)

| Skill | Slash Command | Purpose |
|---|---|---|
| c-core | /c | This coordinator |
| c-notes | /c-notes | Apple Notes + Reminders |
| c-obsidian | /c-obsidian | Obsidian vault |
| c-notion | /c-notion | Notion pages/databases |
| c-tasks | /c-tasks | Todoist / Things / Taskwarrior |
| c-email | /c-email | Gmail (gog) / IMAP (himalaya) |
| c-calendar | /c-calendar | Google Cal (gog) / Apple Cal (icalpal) |
| c-messaging | /c-messaging | iMessage (imsg) / WhatsApp (wacli) |
| c-github | /c-github | GitHub via gh CLI |
| c-jira | /c-jira | Jira issues |
| c-linear | /c-linear | Linear issues |
| c-slack | /c-slack | Slack messages |
| c-social | /c-social | Social media posting |
| c-research | /c-research | Web research |
| c-music | /c-music | Music playback |
| c-voice | /c-voice | Voice/TTS |
| c-lights | /c-lights | Smart lights |
| c-speakers | /c-speakers | Speaker control |
| c-bluetooth | /c-bluetooth | Bluetooth devices |
| c-screen | /c-screen | Screen capture |
| c-video | /c-video | Video tools |
| c-location | /c-location | Location/maps |
| c-secrets | /c-secrets | Secrets/credentials |
| c-tracking | /c-tracking | Time/habit tracking |

## Routing Guidelines

- Match the user's intent to the most specific skill above.
- If multiple skills apply, invoke them in sequence.
- If a skill's CLI tool is missing, tell the user which skill handles their request and suggest they install the skill.
- Never guess at CLI commands from other skills — invoke the correct skill instead.

## Checking for Installed Skills

Run `ls ~/.claude/skills/` or check for the relevant CLI tool with `which <tool>` to determine availability.
