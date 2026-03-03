import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import type { LockInConfig, LockInSession } from "../types.js";

const CONFIG_DIR = path.join(os.homedir(), ".config", "openpaw");
const LOCKIN_PATH = path.join(CONFIG_DIR, "lockin.json");
const SESSION_PATH = path.join(CONFIG_DIR, "lockin-session.json");

function ensureDir(): void {
	fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// ── Config I/O ──

export function readLockInConfig(): LockInConfig | null {
	try {
		const raw = fs.readFileSync(LOCKIN_PATH, "utf-8");
		return JSON.parse(raw) as LockInConfig;
	} catch {
		return null;
	}
}

export function writeLockInConfig(config: LockInConfig): void {
	ensureDir();
	fs.writeFileSync(LOCKIN_PATH, JSON.stringify(config, null, 2));
	fs.chmodSync(LOCKIN_PATH, 0o600);
}

export function lockInConfigExists(): boolean {
	return fs.existsSync(LOCKIN_PATH);
}

// ── Session I/O ──

export function readLockInSession(): LockInSession | null {
	try {
		const raw = fs.readFileSync(SESSION_PATH, "utf-8");
		return JSON.parse(raw) as LockInSession;
	} catch {
		return null;
	}
}

export function writeLockInSession(session: LockInSession): void {
	ensureDir();
	fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
}

export function clearLockInSession(): void {
	try {
		fs.unlinkSync(SESSION_PATH);
	} catch {}
}

// ── Auto-detection ──

export interface DetectedCapabilities {
	hasBluetooth: boolean;
	bluetoothDevices: string[];
	hasSpotify: boolean;
	hasAppleMusic: boolean;
	hasSonos: boolean;
	hasYtDlp: boolean;
	hasHue: boolean;
	hueRooms: string[];
	hasSlack: boolean;
	hasObsidian: boolean;
	hasTerminalNotifier: boolean;
	hasTelegram: boolean;
	runningApps: string[];
}

function cmdExists(cmd: string): boolean {
	try {
		execSync(`command -v ${cmd}`, { stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}

function tryExec(cmd: string): string {
	try {
		return execSync(cmd, { stdio: "pipe", timeout: 5000 }).toString().trim();
	} catch {
		return "";
	}
}

export function detectCapabilities(): DetectedCapabilities {
	const caps: DetectedCapabilities = {
		hasBluetooth: false,
		bluetoothDevices: [],
		hasSpotify: false,
		hasAppleMusic: false,
		hasSonos: false,
		hasYtDlp: false,
		hasHue: false,
		hueRooms: [],
		hasSlack: false,
		hasObsidian: false,
		hasTerminalNotifier: false,
		hasTelegram: false,
		runningApps: [],
	};

	// Bluetooth
	if (cmdExists("blu")) {
		caps.hasBluetooth = true;
		const out = tryExec("blu list --paired 2>/dev/null");
		if (out) {
			caps.bluetoothDevices = out
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean)
				.slice(0, 10);
		}
	} else if (cmdExists("blueutil")) {
		caps.hasBluetooth = true;
	}

	// Music
	caps.hasSpotify = cmdExists("spogo");
	caps.hasAppleMusic = process.platform === "darwin";
	caps.hasSonos = cmdExists("sonos");
	caps.hasYtDlp = cmdExists("yt-dlp");

	// Hue
	if (cmdExists("openhue")) {
		caps.hasHue = true;
		const rooms = tryExec("openhue get rooms --json 2>/dev/null");
		if (rooms) {
			try {
				const parsed = JSON.parse(rooms);
				if (Array.isArray(parsed)) {
					caps.hueRooms = parsed.map((r: { metadata?: { name?: string } }) => r.metadata?.name).filter(Boolean) as string[];
				}
			} catch {}
		}
	}

	// Slack
	caps.hasSlack = cmdExists("slack");

	// Obsidian
	caps.hasObsidian = cmdExists("obsidian-cli");

	// Notifications
	caps.hasTerminalNotifier = cmdExists("terminal-notifier");

	// Telegram config
	try {
		const tgPath = path.join(CONFIG_DIR, "telegram.json");
		caps.hasTelegram = fs.existsSync(tgPath);
	} catch {}

	// Running apps (macOS)
	if (process.platform === "darwin") {
		const out = tryExec(
			`osascript -e 'tell application "System Events" to get name of every process whose background only is false' 2>/dev/null`,
		);
		if (out) {
			caps.runningApps = out.split(", ").filter(Boolean);
		}
	}

	return caps;
}

// ── Script Generation ──

export function generateStartScript(opts: {
	config: LockInConfig;
	endsAt: string;
	extraSites?: string[];
	extraApps?: string[];
}): string {
	const { config, endsAt, extraSites = [], extraApps = [] } = opts;
	const durationMin = config.duration;
	const durationSec = durationMin * 60;
	const lines: string[] = ["#!/bin/bash", ""];

	// Site blocking (PAC file)
	const allSites = [
		...(config.blockedSites?.always || []),
		...extraSites,
	];
	if (allSites.length > 0) {
		const siteList = allSites.map((s) => `"${s}"`).join(",");
		lines.push("# Site blocking via PAC file");
		lines.push(`cat > /tmp/lockin-block.pac << 'PACEOF'
function FindProxyForURL(url, host) {
  var blocked = [${siteList}];
  for (var i = 0; i < blocked.length; i++) {
    if (dnsDomainIs(host, blocked[i]) || dnsDomainIs(host, "www." + blocked[i])) {
      return "PROXY 127.0.0.1:1";
    }
  }
  return "DIRECT";
}
PACEOF`);
		lines.push(`python3 -m http.server 9777 --directory /tmp &>/dev/null &`);
		lines.push(`sleep 1`);
		lines.push(`networksetup -listallnetworkservices | tail -n +2 | while IFS= read -r svc; do networksetup -setautoproxyurl "$svc" "http://127.0.0.1:9777/lockin-block.pac" 2>/dev/null; done`);
		lines.push(`defaults write com.google.Chrome IncognitoModeAvailability -integer 1`);
		lines.push("");
	}

	// Quit apps
	const allApps = [
		...(config.quitApps?.always || []),
		...extraApps,
	];
	if (allApps.length > 0) {
		lines.push("# Quit apps");
		for (const app of allApps) {
			lines.push(`osascript -e 'quit app "${app}"' 2>/dev/null || true`);
		}
		lines.push("");
	}

	// Bluetooth
	if (config.bluetooth?.device) {
		lines.push("# Bluetooth");
		lines.push(`blu connect "${config.bluetooth.device}" 2>/dev/null || true`);
		lines.push("");
	}

	// Music
	if (config.music) {
		lines.push("# Music");
		const q = config.music.query;
		switch (config.music.source) {
			case "youtube":
				lines.push(`open "${q}"`);
				break;
			case "spotify":
				lines.push(`spogo play "${q}" 2>/dev/null || true`);
				break;
			case "apple-music":
				lines.push(`osascript -e 'tell application "Music" to play (first playlist whose name contains "${q}")' 2>/dev/null || true`);
				break;
			case "sonos":
				lines.push(`sonos play "${q}" 2>/dev/null || true`);
				break;
		}
		lines.push("");
	}

	// Lights
	if (config.lights) {
		lines.push("# Lights");
		let cmd = `openhue set room "${config.lights.room}" --on --brightness ${config.lights.brightness}`;
		if (config.lights.color) cmd += ` --color "${config.lights.color}"`;
		lines.push(`${cmd} 2>/dev/null || true`);
		lines.push("");
	}

	// DND
	if (config.dnd) {
		lines.push("# Do Not Disturb");
		lines.push(`shortcuts run "Set Focus" 2>/dev/null || { defaults -currentHost write com.apple.notificationcenterui doNotDisturb -boolean true && killall NotificationCenter 2>/dev/null; } || true`);
		lines.push("");
	}

	// Slack DND
	if (config.slackDnd) {
		lines.push("# Slack DND");
		lines.push(`slack dnd set ${durationMin} 2>/dev/null || true`);
		lines.push("");
	}

	// Timer notification
	if (config.timer) {
		lines.push("# Timer notification");
		lines.push(`(sleep ${durationSec} && terminal-notifier -title "Lock In Complete" -message "Session finished! Time for a break." -sound default) &`);
		lines.push("");
	}

	// Window management + dashboard timer
	lines.push("# Window management");
	lines.push(`FRONT_APP=$(osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true' 2>/dev/null || echo "Terminal")`);
	lines.push("");
	lines.push("# Center coding app at ~80% screen");
	lines.push(`osascript << 'ASCRIPT'
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
ASCRIPT`);
	lines.push("");

	const encodedEnds = encodeURIComponent(endsAt);
	lines.push("# Start dashboard + open timer");
	lines.push(`curl -s -o /dev/null http://localhost:3141 2>/dev/null || nohup openpaw dashboard --no-open &>/dev/null &`);
	lines.push(`sleep 1 && open "http://localhost:3141/focus?ends=${encodedEnds}&duration=${durationMin}"`);
	lines.push("");

	lines.push("# Position timer top-left");
	lines.push(`sleep 2 && osascript << 'ASCRIPT'
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
end tell
tell application frontApp
    set bounds of front window to {0, 25, 400, 325}
end tell
ASCRIPT`);
	lines.push("");

	lines.push("# Bring coding app back");
	lines.push(`osascript -e "tell application \\"$FRONT_APP\\" to activate"`);
	lines.push("");

	lines.push("# Minimize everything else");
	lines.push(`osascript << 'ASCRIPT'
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
    repeat with proc in (every process whose visible is true and name is not frontApp and name is not "Finder")
        try
            click (first button of (first window of proc) whose subrole is "AXMinimizeButton")
        end try
    end repeat
end tell
ASCRIPT`);
	lines.push("");

	// Write session file
	const startedAt = new Date().toISOString();
	const sessionData: LockInSession = {
		startedAt,
		endsAt,
		config,
		blockedSiteAttempts: 0,
		gitCommitsBefore: 0,
	};
	lines.push("# Write session file");
	lines.push(`GIT_COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo 0)`);
	const sessionJson = JSON.stringify(sessionData);
	// Replace gitCommitsBefore:0 with the shell variable
	const sessionWithGit = sessionJson.replace(
		'"gitCommitsBefore":0',
		'"gitCommitsBefore":'+"$GIT_COMMITS",
	);
	lines.push(`echo '${sessionWithGit.replace(/'/g, "'\\''")}' | sed "s/\\$GIT_COMMITS/$GIT_COMMITS/g" > ~/.config/openpaw/lockin-session.json`);
	lines.push("");
	lines.push(`echo "Locked in until $(date -j -f '%Y-%m-%dT%H:%M' '${endsAt.slice(0, 16)}' '+%I:%M %p' 2>/dev/null || echo '${endsAt}')"`);

	return lines.join("\n");
}

export function generateEndScript(config: LockInConfig): string {
	const lines: string[] = ["#!/bin/bash", ""];

	// Read session data at runtime
	lines.push("# Read session data");
	lines.push(`SESSION_FILE=~/.config/openpaw/lockin-session.json`);
	lines.push(`if [ -f "$SESSION_FILE" ]; then`);
	lines.push(`  STARTED_AT=$(python3 -c "import json; print(json.load(open('$SESSION_FILE'))['startedAt'])" 2>/dev/null || echo "")`);
	lines.push(`  GIT_BEFORE=$(python3 -c "import json; print(json.load(open('$SESSION_FILE'))['gitCommitsBefore'])" 2>/dev/null || echo "0")`);
	lines.push(`else`);
	lines.push(`  STARTED_AT=""`);
	lines.push(`  GIT_BEFORE=0`);
	lines.push(`fi`);
	lines.push("");

	// Remove site blocking
	if (config.blockedSites && (config.blockedSites.always.length > 0 || config.blockedSites.askEachTime.length > 0)) {
		lines.push("# Remove site blocking");
		lines.push(`networksetup -listallnetworkservices | tail -n +2 | while IFS= read -r svc; do networksetup -setautoproxystate "$svc" off 2>/dev/null; done`);
		lines.push(`pkill -f "python3 -m http.server 9777" 2>/dev/null; rm -f /tmp/lockin-block.pac`);
		lines.push(`defaults delete com.google.Chrome IncognitoModeAvailability 2>/dev/null || true`);
		lines.push("");
	}

	// Disable DND
	if (config.dnd) {
		lines.push("# Disable DND");
		lines.push(`defaults -currentHost write com.apple.notificationcenterui doNotDisturb -boolean false && killall NotificationCenter 2>/dev/null || true`);
		lines.push("");
	}

	// Stop music
	if (config.music) {
		lines.push("# Stop music");
		lines.push(`osascript -e 'tell application "Music" to pause' 2>/dev/null; osascript -e 'tell application "Spotify" to pause' 2>/dev/null || true`);
		lines.push("");
	}

	// Git receipt
	lines.push("# Git receipt");
	lines.push(`echo "--- Git Activity ---"`);
	lines.push(`if [ -n "$STARTED_AT" ]; then git log --oneline --after="$STARTED_AT" 2>/dev/null || echo "(no commits)"; fi`);
	lines.push(`echo ""`);
	lines.push(`COMMITS_NOW=$(git rev-list --count HEAD 2>/dev/null || echo 0)`);
	lines.push(`COMMITS_DIFF=$((COMMITS_NOW - GIT_BEFORE))`);
	lines.push(`if [ "$COMMITS_DIFF" -gt 0 ]; then git diff --stat "HEAD~$COMMITS_DIFF" 2>/dev/null; fi`);
	lines.push("");

	// Delete session file
	lines.push("# Cleanup");
	lines.push(`rm -f ~/.config/openpaw/lockin-session.json`);
	lines.push(`rm -f /tmp/lockin-start.sh /tmp/lockin-end.sh`);

	return lines.join("\n");
}

// Common distracting sites
export const COMMON_BLOCKED_SITES = [
	"x.com",
	"reddit.com",
	"instagram.com",
	"facebook.com",
	"tiktok.com",
	"youtube.com",
	"linkedin.com",
	"threads.net",
	"bsky.app",
	"discord.com",
	"twitch.tv",
];

// Common distracting apps
export const COMMON_QUIT_APPS = [
	"Messages",
	"Mail",
	"Discord",
	"Slack",
	"Telegram",
	"WhatsApp",
	"Twitter",
	"Safari",
	"Chrome",
	"Firefox",
];
