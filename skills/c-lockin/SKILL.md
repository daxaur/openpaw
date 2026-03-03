---
name: c-lockin
description: Lock In Mode — orchestrate distraction blocking, environment setup, and session tracking.
tags: [lockin, focus, productivity, deep-work, pomodoro, distraction-blocking]
---

## What This Skill Does

You orchestrate lock-in sessions by reading config and running commands directly.
Do NOT use `openpaw lockin start` or `openpaw lockin end` — those commands do not exist.
You run each step yourself using the bash commands below.

## Config

Read `~/.config/openpaw/lockin.json` for preferences. If missing, suggest: `openpaw lockin setup`

## Starting a Lock In Session

When the user says "lock in", "focus", "deep work", or similar:

1. Read `~/.config/openpaw/lockin.json`
2. Check `~/.config/openpaw/lockin-session.json` — if it exists and `endsAt` is in the future, a session is already active
3. If there are `askEachTime` sites or apps, ask the user which to include this session
4. Tell the user what you're about to do
5. Calculate `endsAt` = now + duration minutes (ISO 8601 format)
6. Run each enabled step below in order
7. Write the session file (see Session File section)
8. Open the dashboard focus timer if the dashboard is running

### Site Blocking (SelfControl)

Only if `siteBlocker` is `"selfcontrol"` and `blockedSites` has entries.

SelfControl blocks cannot be ended early — this is by design. Warn the user before starting.

1. Build the site list from `blockedSites.always` + any selected `askEachTime` sites
2. Write a blocklist plist file:

```bash
cat > /tmp/lockin-blocklist.selfcontrol << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Blocklist</key>
    <array>
        <dict><key>hostname</key><string>SITE_HERE</string></dict>
    </array>
    <key>BlockAsWhitelist</key>
    <false/>
</dict>
</plist>
PLIST
```

Replace SITE_HERE with actual domains. Add one `<dict><key>hostname</key><string>...</string></dict>` per site.

3. Start the block:

```bash
/Applications/SelfControl.app/Contents/MacOS/selfcontrol-cli start \
  --blocklist /tmp/lockin-blocklist.selfcontrol \
  --enddate "ENDS_AT_ISO8601"
```

This will prompt for admin credentials via a native macOS dialog (not in terminal).

### Quit Apps

Only if `quitApps` has entries. For each app:

```bash
osascript -e 'quit app "APP_NAME"'
```

### Bluetooth

Only if `bluetooth.device` is set:

```bash
blu connect "DEVICE_NAME"
```

### Music

Only if `music` is set. Based on `music.source`:

- **spotify**: `spogo play "QUERY"`
- **apple-music**: `osascript -e 'tell application "Music" to play (first playlist whose name contains "QUERY")'`
- **sonos**: `sonos play "QUERY"`
- **youtube**: `yt-dlp -x --audio-format mp3 -o - "ytsearch1:QUERY" | afplay -` (background with &)

### Lights

Only if `lights` is set:

```bash
openhue set room "ROOM" --on --brightness BRIGHTNESS
```

If `lights.color` is set, add `--color "COLOR"`.

### Do Not Disturb

Only if `dnd` is true (macOS only):

```bash
shortcuts run "Set Focus" 2>/dev/null || defaults -currentHost write com.apple.notificationcenterui doNotDisturb -boolean true && killall NotificationCenter 2>/dev/null
```

### Slack DND

Only if `slackDnd` is true:

```bash
slack dnd set DURATION_MINUTES
```

### Timer Notification

Only if `timer` is true:

```bash
(sleep DURATION_SECONDS && terminal-notifier -title "Lock In Complete" -message "Session finished! Time for a break." -sound default) &
```

### Dashboard Focus Timer

If the dashboard is running (port 3141), open the timer page:

```bash
open "http://localhost:3141/focus?ends=ENDS_AT_ISO8601&duration=DURATION_MIN"
```

### Window Positioning

After all setup, arrange windows for focus:

```bash
# Get screen size
SCREEN_SIZE=$(osascript -e 'tell application "Finder" to get bounds of window of desktop' 2>/dev/null || echo "0, 0, 1920, 1080")

# Center the frontmost app (your coding window) at ~80% screen
osascript -e '
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
end tell
tell application frontApp
    set bounds of front window to {CALCULATED_BOUNDS}
end tell
'

# Minimize other windows
osascript -e '
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
    repeat with proc in (every process whose visible is true and name is not frontApp and name is not "Finder")
        try
            click (first button of (first window of proc) whose subrole is "AXMinimizeButton")
        end try
    end repeat
end tell
'
```

Calculate centered bounds: x = (screen_width - window_width) / 2, y = 50, width = screen_width * 0.8, height = screen_height - 100.

### Session File

Write `~/.config/openpaw/lockin-session.json`:

```json
{
  "startedAt": "ISO_TIMESTAMP",
  "endsAt": "ISO_TIMESTAMP",
  "config": { /* copy of the config used this session */ },
  "blockedSiteAttempts": 0,
  "gitCommitsBefore": GIT_COMMIT_COUNT
}
```

Get git commit count: `git rev-list --count HEAD 2>/dev/null || echo 0`

## Ending a Lock In Session

When the user says "stop", "end session", "I'm done":

1. **Disable DND**: `defaults -currentHost write com.apple.notificationcenterui doNotDisturb -boolean false && killall NotificationCenter 2>/dev/null`
2. **Stop music**: `osascript -e 'tell application "Music" to pause' 2>/dev/null; osascript -e 'tell application "Spotify" to pause' 2>/dev/null`
3. **SelfControl**: blocks expire on their own — nothing to do
4. **Git receipt**: gather stats since session start

```bash
# Commits during session
git log --oneline --after="STARTED_AT" 2>/dev/null

# Diff stats
git diff --stat HEAD~N 2>/dev/null
```

5. **Obsidian log** (if `obsidianLog` is true): `obsidian-cli append daily "## Lock In Session\n- Duration: X min\n- Commits: N\n..."`
6. **Delete session file**: `rm ~/.config/openpaw/lockin-session.json`
7. **Write a warm summary** with:
   - Total session duration
   - Number of commits + their messages
   - Lines added/removed
   - An encouraging note referencing SOUL.md personality

## Reconfigure

```bash
openpaw lockin setup      # Interactive setup wizard
openpaw lockin configure  # Alias for setup
```

## Guidelines

- Only start a session when the user explicitly asks — never suggest unprompted
- Always tell the user what you're about to do before starting
- If a command fails, tell the user and continue with other steps
- Skip any step whose config field is missing or false
- Warn about SelfControl blocks being unbypassable before starting
- Reference SOUL.md for personal preferences
- When ending, write a human summary — don't just dump numbers
- Include commit messages in the summary to highlight what they accomplished
