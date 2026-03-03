---
name: c-focus
description: Focus Mode — orchestrate website blocking, app quitting, bluetooth, music, lights, DND, Slack, and timer based on user's saved preferences.
tags: [focus, productivity, deep-work, pomodoro, distraction-blocking]
---

## What This Skill Does

You orchestrate focus sessions by reading the user's config and executing shell commands directly. The config is created by `openpaw focus setup` — you don't need the CLI to run a session.

## Config

Read the user's preferences from `~/.config/openpaw/focus.json`. Example:

```json
{
  "duration": 90,
  "bluetooth": { "device": "AirPods Pro" },
  "music": { "source": "spotify", "query": "lo-fi beats" },
  "blockedSites": {
    "always": ["x.com", "reddit.com", "instagram.com"],
    "askEachTime": ["youtube.com"]
  },
  "quitApps": {
    "always": ["Messages", "Mail"],
    "askEachTime": ["Discord"]
  },
  "lights": { "room": "Office", "brightness": 30, "color": "warm" },
  "dnd": true,
  "slackDnd": true,
  "timer": true,
  "obsidianLog": true
}
```

## Starting a Focus Session

When the user says "focus", "deep work", "lock in", or similar:

1. Read `~/.config/openpaw/focus.json`. If missing, suggest: `openpaw focus setup`
2. Check `~/.config/openpaw/focus-session.json` — if it exists, a session is already active
3. If there are `askEachTime` sites or apps, ask the user which to include this session
4. Tell the user what you're about to do, then execute each step:

### Commands to Run (in order)

**Block websites** (if `blockedSites` configured):
```bash
# For each site in always + user-approved askEachTime list:
echo "127.0.0.1 site.com # OPENPAW-FOCUS
127.0.0.1 www.site.com # OPENPAW-FOCUS" | sudo tee -a /etc/hosts > /dev/null
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Quit apps** (if `quitApps` configured):
```bash
osascript -e 'quit app "Messages"'
osascript -e 'quit app "Mail"'
# etc.
```

**Connect bluetooth** (if `bluetooth` configured):
```bash
blu connect "AirPods Pro"
```

**Play music** (if `music` configured):
```bash
# Spotify:
spogo search playlist "lo-fi beats" --play
# Apple Music:
osascript -e 'tell application "Music" to play playlist "Focus"'
# Sonos:
sonos play "playlist name"
# YouTube (yt-dlp):
yt-dlp -x --audio-format mp3 -o "/tmp/openpaw-focus.%(ext)s" "ytsearch1:white noise 1 hour" && afplay /tmp/openpaw-focus.mp3 &
```

**Set lights** (if `lights` configured):
```bash
openhue set room "Office" --on --brightness 30 --color "warm"
```

**Enable DND** (if `dnd: true`):
```bash
defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean true
killall NotificationCenter
```

**Slack DND** (if `slackDnd: true`):
```bash
slack dnd set 90
```

5. Write the session file to `~/.config/openpaw/focus-session.json`:
```json
{
  "startedAt": "2026-03-03T10:00:00.000Z",
  "endsAt": "2026-03-03T11:30:00.000Z",
  "config": { ... },
  "blockedSiteAttempts": 0,
  "gitCommitsBefore": 42
}
```
Get `gitCommitsBefore` with: `git rev-list --count HEAD`

6. Start the auto-end timer (sends Telegram summary when time is up):
```bash
openpaw focus auto-end &
```
This sleeps for the duration, then spawns a Claude session to restore everything and send a summary.

Or if you prefer, just run `openpaw focus start` to do steps 4-6 automatically.

## Ending a Focus Session

When the user says "stop focus", "end focus", "I'm done", or the timer fires:

1. **Restore environment:**
```bash
# Unblock sites
sudo sed -i '' '/OPENPAW-FOCUS/d' /etc/hosts
sudo dscacheutil -flushcache
# Disable DND
defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean false
killall NotificationCenter
# Stop music
spogo pause  # or: osascript -e 'tell application "Music" to pause'
```

2. **Generate receipt** — read the session file and compute:
```bash
# Commits since session start
git rev-list --count HEAD  # subtract gitCommitsBefore
# Lines changed
git diff --stat HEAD~N HEAD
```

3. **Summarize naturally** — tell the user:
   - How long they focused
   - Commits made, lines added/removed
   - Be encouraging and specific

4. **Optional**: log to Obsidian if `obsidianLog: true`
5. Delete `~/.config/openpaw/focus-session.json`

## Setup (user runs this)

```bash
openpaw focus setup      # Interactive wizard
openpaw focus configure  # Alias
```

## Guidelines

- Only start focus when the user explicitly asks — never suggest unprompted
- Always tell the user what you're doing before each step
- If a command fails (e.g. sudo denied), tell the user and continue with other steps
- Reference SOUL.md for personal preferences
- When ending, write a human summary — don't just dump numbers
