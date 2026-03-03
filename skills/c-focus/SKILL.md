---
name: c-focus
description: Focus Mode — one command to block distractions, set the mood, and track your deep work session. Orchestrates website blocking, app quitting, bluetooth, music, lights, DND, Slack, and timer.
tags: [focus, productivity, deep-work, pomodoro, distraction-blocking]
---

## What This Skill Does

Manages focus sessions that orchestrate multiple actions — blocking websites, quitting apps, connecting headphones, starting music, dimming lights, enabling DND, and tracking productivity via git stats.

## Commands for Claude

Use these non-interactive commands:

```bash
# Start a focus session (applies "always" config)
openpaw focus start

# Start with ALL sites/apps (including "ask-each-time" ones)
openpaw focus start --all

# Check if a session is active
openpaw focus status

# End the session — restores environment, prints receipt
openpaw focus end
```

## Interactive Commands (user runs directly)

```bash
openpaw focus setup      # Setup wizard (auto-detects capabilities)
openpaw focus            # Interactive start (asks about ask-each-time items)
openpaw focus configure  # Reconfigure
```

## How to Use This Skill

When the user says "focus", "deep work", "lock in", or similar:

1. Run `openpaw focus status` to check current state
2. If no session is active and there are ask-each-time items in config, ask the user if they want to include those too
   - Yes → `openpaw focus start --all`
   - No → `openpaw focus start`
3. If no ask-each-time items, just run `openpaw focus start`
4. Tell the user what was activated (the command prints this)

When the user says "stop focus", "end focus", "I'm done":

1. Run `openpaw focus end`
2. Read the receipt and **summarize the session** naturally:
   - How long they focused
   - Commits made, lines written
   - Encourage them based on the output

If not configured: suggest `openpaw focus setup`

## What Gets Orchestrated

| Action | How |
|---|---|
| Block websites | `/etc/hosts` + DNS flush (sudo) |
| Quit apps | `osascript` |
| Bluetooth | `blu connect` |
| Music | spogo / osascript / sonos / yt-dlp |
| Lights | `openhue set room` |
| Do Not Disturb | macOS defaults |
| Slack DND | `slack dnd set` |
| Timer | background `terminal-notifier` |

## Config

`~/.config/openpaw/focus.json` — supports "always" vs "ask-each-time" for sites and apps.

## Guidelines

- Don't suggest focus mode unprompted — only when the user expresses intent
- When ending, summarize the receipt naturally, don't just dump numbers
- Reference SOUL.md for the user's focus preferences
