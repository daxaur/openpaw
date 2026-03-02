---
name: c-focus
description: Focus Mode — one command to block distractions, set the mood, and track your deep work session. Orchestrates website blocking, app quitting, bluetooth, music, lights, DND, Slack, and timer.
tags: [focus, productivity, deep-work, pomodoro, distraction-blocking]
---

## What This Skill Does

Enables Claude to manage focus sessions that orchestrate multiple skills simultaneously — blocking distracting websites, quitting apps, connecting headphones, starting music, dimming lights, enabling Do Not Disturb, and tracking productivity.

## Commands

```bash
# Start a focus session (uses saved config)
openpaw focus

# Set up Focus Mode (auto-detects machine capabilities)
openpaw focus setup

# Reconfigure Focus Mode
openpaw focus configure
```

## How Focus Mode Works

When the user says "focus", "deep work", "start a focus session", or similar:

1. **Check config** — Run `openpaw focus` to start a session
2. If not configured, suggest `openpaw focus setup`
3. The command handles everything: site blocking, app quitting, bluetooth, music, lights, DND, Slack DND, timer

### What Gets Orchestrated

| Action | How | Requires |
|---|---|---|
| Block websites | `/etc/hosts` + DNS flush | sudo access |
| Quit apps | `osascript -e 'quit app "X"'` | macOS |
| Connect bluetooth | `blu connect "device"` | c-bluetooth |
| Play music | `spogo`, `osascript`, `sonos`, `yt-dlp` | depends on source |
| Set lights | `openhue set room` | c-lights |
| Do Not Disturb | macOS defaults write | macOS |
| Slack DND | `slack dnd set N` | c-slack |
| Timer notification | `terminal-notifier` | c-notify |

### Focus Receipt

When a session ends, a receipt shows:
- Duration
- Git commits made during session
- Lines added/removed
- Sites blocked count

Can optionally log to Obsidian or send via Telegram.

## Config Location

`~/.config/openpaw/focus.json`

Supports "always" vs "ask-each-time" lists for both websites and apps.

## Usage Guidelines

- When the user asks to focus or start deep work, run `openpaw focus`
- If they want to change settings, run `openpaw focus setup`
- If they say "stop focus" or "end focus", run `openpaw focus` (it detects active session and offers to end)
- Don't suggest focus mode unprompted — only when the user expresses intent to concentrate
- Reference SOUL.md for the user's preferred focus duration and music preferences
