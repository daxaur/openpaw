---
name: c-lockin
description: Lock In Mode — orchestrate distraction blocking, environment setup, and session tracking.
tags: [lockin, focus, productivity, deep-work, pomodoro, distraction-blocking]
---

## What This Skill Does

You orchestrate lock-in sessions by reading the user's config and running shell commands directly.

## Config

Read `~/.config/openpaw/lockin.json` for preferences. If missing, suggest: `openpaw lockin setup`

```json
{
  "duration": 90,
  "bluetooth": { "device": "AirPods Pro" },
  "music": { "source": "spotify", "query": "lo-fi beats" },
  "blockedSites": {
    "always": ["x.com", "reddit.com"],
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

## Starting a Lock In Session

When the user says "lock in", "focus", "deep work", or similar:

1. Read `~/.config/openpaw/lockin.json`
2. Check `~/.config/openpaw/lockin-session.json` — if it exists, a session is already active
3. If there are `askEachTime` sites or apps, ask the user which to include this session
4. Tell the user what you're about to do, then execute each enabled step:

### Commands to Run (in order)

**Block websites** (if `blockedSites` configured):
```bash
# For each site in always + user-approved askEachTime list:
echo "127.0.0.1 site.com # OPENPAW-LOCKIN
127.0.0.1 www.site.com # OPENPAW-LOCKIN" | sudo tee -a /etc/hosts > /dev/null
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Quit apps** (if `quitApps` configured):
```bash
osascript -e 'quit app "AppName"'
```

**Connect bluetooth** (if `bluetooth` configured):
```bash
blu connect "device name"
```

**Play music** (if `music` configured):
```bash
# spotify:
spogo search playlist "query" --play
# apple-music:
osascript -e 'tell application "Music" to play playlist "query"'
# sonos:
sonos play "query"
# youtube (yt-dlp — prefix non-URLs with ytsearch1:):
yt-dlp -x --audio-format mp3 -o "/tmp/openpaw-lockin.%(ext)s" "ytsearch1:query" && afplay /tmp/openpaw-lockin.mp3 &
```

**Set lights** (if `lights` configured):
```bash
openhue set room "room" --on --brightness N --color "color"
```

**Arrange windows** (if `windows` configured):
Run `openpaw lockin start` which handles window arrangement automatically.
Windows are saved and restored when the session ends.

**Enable DND** (if `dnd: true`):
```bash
defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean true
killall NotificationCenter
```

**Slack DND** (if `slackDnd: true`):
```bash
slack dnd set <duration>
```

**Write the session file** to `~/.config/openpaw/lockin-session.json`:
```json
{
  "startedAt": "<ISO timestamp>",
  "endsAt": "<ISO timestamp + duration>",
  "config": { ... },
  "blockedSiteAttempts": 0,
  "gitCommitsBefore": <output of git rev-list --count HEAD>
}
```

**Start the auto-end timer:**
```bash
openpaw lockin auto-end &
```
This sleeps for the duration, then restores everything and sends a summary via Telegram.

Or run `openpaw lockin start` to do all of the above automatically.

## Ending a Lock In Session

When the user says "stop", "end session", "I'm done", or the timer fires:

1. **Restore environment:**
```bash
# Unblock sites
sudo sed -i '' '/OPENPAW-LOCKIN/d' /etc/hosts
sudo dscacheutil -flushcache
# Disable DND
defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean false
killall NotificationCenter
# Stop music (use the matching command for the source)
spogo pause
```

2. **Generate receipt:**
```bash
git rev-list --count HEAD  # subtract gitCommitsBefore from session file
git diff --stat HEAD~N HEAD
```

3. **Summarize naturally** — how long they locked in, commits made, lines added/removed. Be encouraging.
4. **Log to Obsidian** if `obsidianLog: true`
5. Delete `~/.config/openpaw/lockin-session.json`

## Reconfigure

```bash
openpaw lockin setup      # Interactive wizard
openpaw lockin configure  # Alias
```

## Guidelines

- Only start a session when the user explicitly asks — never suggest unprompted
- Always tell the user what you're doing before each step
- If a command fails (e.g. sudo denied), tell the user and continue with other steps
- Skip any step whose config field is missing or false
- Reference SOUL.md for personal preferences
- When ending, write a human summary — don't just dump numbers
