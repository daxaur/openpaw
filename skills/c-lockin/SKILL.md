---
name: c-lockin
description: Lock In Mode — orchestrate distraction blocking, environment setup, and session tracking.
tags: [lockin, focus, productivity, deep-work, pomodoro, distraction-blocking]
---

## Behavior

You run lock-in sessions by reading config and executing commands directly.
Be FAST. Say one short line like "Locking you in for 90 min" then silently execute every step. Don't narrate or explain each step — just run them. Only speak again when done ("Locked in until HH:MM") or if something fails.

Do NOT use `openpaw lockin start` or `openpaw lockin end` — those don't exist.
CRITICAL: Run each bash command ONE AT A TIME. Never run multiple in parallel.

## Config

Read `~/.config/openpaw/lockin.json`. If missing → suggest `openpaw lockin setup`

## Starting a Session

When the user says "lock in", "focus", "deep work", etc:

1. Read config + check `~/.config/openpaw/lockin-session.json` (if `endsAt` is future → already active)
2. If `askEachTime` items exist, ask briefly which to include
3. Say ONE line like "Locking you in for 90 min" then execute
4. Calculate `endsAt` = now + duration minutes (ISO 8601)
5. Run each step below ONE AT A TIME
6. Write session file
7. Say "Locked in until HH:MM"

### Site Blocking (PAC File)

Only if `blockedSites` has entries.

1. Write PAC file (replace SITE_LIST with actual quoted domains like `"x.com","reddit.com"`):

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

2. Start PAC server:

```bash
python3 -m http.server 9777 --directory /tmp &>/dev/null &
```

3. Set auto-proxy on ALL network services (handles Wi-Fi, Ethernet, any connection):

```bash
sleep 1 && networksetup -listallnetworkservices | tail -n +2 | while IFS= read -r svc; do networksetup -setautoproxyurl "$svc" "http://127.0.0.1:9777/lockin-block.pac" 2>/dev/null; done
```

4. Disable Chrome incognito to prevent bypass:

```bash
defaults write com.google.Chrome IncognitoModeAvailability -integer 1
```

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

- **youtube** — audio is pre-cached at `/tmp/lockin-audio.*` during setup. If the file exists, just play it. If not, download first:
```bash
ls /tmp/lockin-audio.* &>/dev/null && nohup afplay /tmp/lockin-audio.* &>/dev/null & || nohup bash -c 'yt-dlp -q -f bestaudio --no-playlist -o "/tmp/lockin-audio.%(ext)s" "ytsearch1:QUERY" && afplay /tmp/lockin-audio.*' &>/dev/null &
```
- **spotify**: `spogo play "QUERY"`
- **apple-music**: `osascript -e 'tell application "Music" to play (first playlist whose name contains "QUERY")'`
- **sonos**: `sonos play "QUERY"`

### Lights

Only if `lights` is set:

```bash
openhue set room "ROOM" --on --brightness BRIGHTNESS
```

If `lights.color` is set, add `--color "COLOR"`.
If openhue fails with a connection error, tell user: "Run `openhue setup` to pair with your Hue bridge."

### Do Not Disturb

Only if `dnd` is true:

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

### Window & Timer Setup (do this last)

1. Note the current frontmost app (the user's coding environment):

```bash
osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'
```

Save this app name — you'll need it in step 5.

2. Center the coding app at ~80% screen:

```bash
osascript << 'ASCRIPT'
tell application "Finder"
    set {x1, y1, x2, y2} to bounds of window of desktop
end tell
set sw to x2 - x1
set sh to y2 - y1
set w to (sw * 0.8) as integer
set h to (sh - 100) as integer
set xPos to ((sw - w) / 2) as integer
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
end tell
tell application frontApp
    set bounds of front window to {xPos, 50, xPos + w, 50 + h}
end tell
ASCRIPT
```

3. Start dashboard if not running, then open focus timer:

```bash
curl -s -o /dev/null http://localhost:3141 2>/dev/null || nohup openpaw dashboard --no-open &>/dev/null &
```

```bash
sleep 1 && open "http://localhost:3141/focus?ends=ENDS_AT_ISO8601&duration=DURATION_MIN"
```

4. Position timer window top-left:

```bash
sleep 2 && osascript << 'ASCRIPT'
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
end tell
tell application frontApp
    set bounds of front window to {0, 25, 400, 325}
end tell
ASCRIPT
```

5. Bring the coding app back to front (use the app name from step 1):

```bash
osascript -e 'tell application "SAVED_APP_NAME" to activate'
```

6. Minimize everything else:

```bash
osascript << 'ASCRIPT'
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
    repeat with proc in (every process whose visible is true and name is not frontApp and name is not "Finder")
        try
            click (first button of (first window of proc) whose subrole is "AXMinimizeButton")
        end try
    end repeat
end tell
ASCRIPT
```

### Session File

Write `~/.config/openpaw/lockin-session.json`:

```json
{
  "startedAt": "ISO_TIMESTAMP",
  "endsAt": "ISO_TIMESTAMP",
  "config": { ... },
  "blockedSiteAttempts": 0,
  "gitCommitsBefore": GIT_COMMIT_COUNT
}
```

Get git commit count: `git rev-list --count HEAD 2>/dev/null || echo 0`

## Ending a Session

When the user says "stop", "end session", "I'm done":

Run each step ONE AT A TIME:

1. **Remove site blocking** — disable proxy on all network services:

```bash
networksetup -listallnetworkservices | tail -n +2 | while IFS= read -r svc; do networksetup -setautoproxystate "$svc" off 2>/dev/null; done
```

```bash
pkill -f "python3 -m http.server 9777" 2>/dev/null; rm -f /tmp/lockin-block.pac
```

```bash
defaults delete com.google.Chrome IncognitoModeAvailability 2>/dev/null
```

2. **Disable DND**: `defaults -currentHost write com.apple.notificationcenterui doNotDisturb -boolean false && killall NotificationCenter 2>/dev/null`

3. **Stop music**:

```bash
pkill -f "afplay /tmp/lockin-audio" 2>/dev/null; rm -f /tmp/lockin-audio.* 2>/dev/null; osascript -e 'tell application "Music" to pause' 2>/dev/null; osascript -e 'tell application "Spotify" to pause' 2>/dev/null
```

4. **Git receipt**:

```bash
git log --oneline --after="STARTED_AT" 2>/dev/null
```

```bash
git diff --stat HEAD~N 2>/dev/null
```

5. **Obsidian log** (if `obsidianLog`): `obsidian-cli append daily "## Lock In Session\n- Duration: X min\n- Commits: N\n..."`
6. **Delete session file**: `rm ~/.config/openpaw/lockin-session.json`
7. **Brief warm summary**: duration, commits + messages, lines changed, encouraging note referencing SOUL.md personality

## Reconfigure

```bash
openpaw lockin setup
```

## Guidelines

- Be FAST — one line to start, execute silently, one line when done
- Never explain or narrate each step before running it — just do it
- Run steps ONE AT A TIME — never parallel
- If a step fails, mention it briefly and move on
- Skip steps whose config field is missing or false
- Only start when the user explicitly asks
- Reference SOUL.md for personality in summaries
