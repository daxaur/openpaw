---
name: c-lockin
description: Lock In Mode — orchestrate distraction blocking, environment setup, and session tracking.
tags: [lockin, focus, productivity, deep-work, pomodoro, distraction-blocking]
---

## What This Skill Does

You orchestrate lock-in sessions by reading config and running commands directly.
Do NOT use `openpaw lockin start` or `openpaw lockin end` — those commands do not exist.
You run each step yourself using the bash commands below.

IMPORTANT: Run each step ONE AT A TIME, sequentially. Do NOT run multiple bash commands in parallel — if one fails, all parallel siblings will error too.

## Config

Read `~/.config/openpaw/lockin.json` for preferences. If missing, suggest: `openpaw lockin setup`

## Starting a Lock In Session

When the user says "lock in", "focus", "deep work", or similar:

1. Read `~/.config/openpaw/lockin.json`
2. Check `~/.config/openpaw/lockin-session.json` — if it exists and `endsAt` is in the future, a session is already active
3. If there are `askEachTime` sites or apps, ask the user which to include this session
4. Tell the user what you're about to do
5. Calculate `endsAt` = now + duration minutes (ISO 8601 format)
6. Run each enabled step below ONE AT A TIME, in order
7. Write the session file (see Session File section)
8. Open the dashboard focus timer if the dashboard is running

### Site Blocking (PAC File + Chrome Policy)

Only if `blockedSites` has entries. No admin password required.

1. Build the site list from `blockedSites.always` + any selected `askEachTime` sites
2. Write a PAC file that blocks those domains:

```bash
cat > /tmp/lockin-block.pac << 'PACEOF'
function FindProxyForURL(url, host) {
  var blocked = [SITE_LIST];
  for (var i = 0; i < blocked.length; i++) {
    if (dnsDomainIs(host, blocked[i]) || dnsDomainIs(host, "www." + blocked[i])) {
      return "PROXY 127.0.0.1:1";
    }
  }
  return "DIRECT";
}
PACEOF
```

Replace `SITE_LIST` with the actual domains as quoted strings, e.g. `"x.com","reddit.com","youtube.com"`

3. Serve the PAC file locally:

```bash
python3 -m http.server 9777 --directory /tmp &>/dev/null &
```

4. Set the system auto-proxy URL:

```bash
networksetup -setautoproxyurl Wi-Fi "http://127.0.0.1:9777/lockin-block.pac"
```

5. Add Chrome-level blocking (covers incognito, proxy bypass):

```bash
defaults write com.google.Chrome URLBlocklist -array CHROME_BLOCKLIST
defaults write com.google.Chrome IncognitoModeAvailability -integer 1
```

Replace `CHROME_BLOCKLIST` with each site as a separate string arg, e.g. `"*://x.com/*" "*://www.x.com/*" "*://reddit.com/*" "*://www.reddit.com/*"`

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
- **youtube**: `nohup bash -c 'yt-dlp -f bestaudio --no-playlist -o - "ytsearch1:QUERY" | afplay -' &>/dev/null &`

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

If the dashboard is running (port 3141), open the timer page and position it top-left:

```bash
open "http://localhost:3141/focus?ends=ENDS_AT_ISO8601&duration=DURATION_MIN"
```

Then position the browser window at top-left:

```bash
osascript -e '
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
end tell
tell application frontApp
    set bounds of front window to {0, 25, 400, 325}
end tell
'
```

### Window Positioning

After opening the timer, switch to the coding app and arrange it for focus:

```bash
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
Get screen size: `osascript -e 'tell application "Finder" to get bounds of window of desktop' 2>/dev/null || echo "0, 0, 1920, 1080"`

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

Run each step ONE AT A TIME:

1. **Remove site blocking**:

```bash
networksetup -setautoproxystate Wi-Fi off
```

```bash
pkill -f "python3 -m http.server 9777" 2>/dev/null; rm -f /tmp/lockin-block.pac
```

```bash
defaults delete com.google.Chrome URLBlocklist 2>/dev/null; defaults delete com.google.Chrome IncognitoModeAvailability 2>/dev/null
```

2. **Disable DND**: `defaults -currentHost write com.apple.notificationcenterui doNotDisturb -boolean false && killall NotificationCenter 2>/dev/null`
3. **Stop music**: `osascript -e 'tell application "Music" to pause' 2>/dev/null; osascript -e 'tell application "Spotify" to pause' 2>/dev/null`
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

- CRITICAL: Run steps ONE AT A TIME — never run multiple bash commands in parallel
- Only start a session when the user explicitly asks — never suggest unprompted
- Always tell the user what you're about to do before starting
- If a command fails, tell the user and continue with the next step
- Skip any step whose config field is missing or false
- Reference SOUL.md for personal preferences
- When ending, write a human summary — don't just dump numbers
- Include commit messages in the summary to highlight what they accomplished
