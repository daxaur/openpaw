---
name: c-lockin
description: Lock In Mode — orchestrate distraction blocking, environment setup, and session tracking.
tags: [lockin, focus, productivity, deep-work, pomodoro, distraction-blocking]
---

## What This Skill Does

You orchestrate lock-in sessions using the `openpaw lockin` CLI.

IMPORTANT: Always use `openpaw lockin start` to begin a session. Never run site-blocking or admin commands individually — they require macOS admin privileges that only work through the CLI.

## Config

Read `~/.config/openpaw/lockin.json` for preferences. If missing, suggest: `openpaw lockin setup`

## Starting a Lock In Session

When the user says "lock in", "focus", "deep work", or similar:

1. Check `~/.config/openpaw/lockin-session.json` — if it exists, a session is already active
2. If there are `askEachTime` sites or apps, ask the user which to include this session
3. Tell the user what you're about to do, then run:

```bash
openpaw lockin start        # Start with "always" sites/apps only
openpaw lockin start --all  # Include all ask-each-time sites/apps too
```

This single command handles everything:
- Blocks configured websites (with a custom roast page on blocked sites)
- Quits distracting apps
- Connects Bluetooth devices
- Plays music
- Sets smart lights
- Enables macOS DND and Slack DND
- Centers the active app and minimizes other windows
- Saves window positions for later restore
- Starts auto-end timer (sends summary via Telegram when done)

## Ending a Lock In Session

When the user says "stop", "end session", "I'm done", or the timer fires:

```bash
openpaw lockin end
```

This restores everything and prints a receipt with:
- Session duration
- Git commits made (with commit messages)
- Lines added/removed
- Blocked site attempt count

## Other Commands

```bash
openpaw lockin status     # Check if a session is active
openpaw lockin setup      # Interactive setup wizard
openpaw lockin configure  # Alias for setup
```

## Guidelines

- Only start a session when the user explicitly asks — never suggest unprompted
- Always tell the user what you're about to do before running start
- Reference SOUL.md for personal preferences
- When ending, write a human summary — don't just dump numbers
- Include commit messages in the summary to highlight what they accomplished
