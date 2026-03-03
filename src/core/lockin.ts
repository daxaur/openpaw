import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import type { LockInConfig, LockInSession } from "../types.js";

const CONFIG_DIR = path.join(os.homedir(), ".config", "openpaw");
const LOCKIN_PATH = path.join(CONFIG_DIR, "lockin.json");
const SESSION_PATH = path.join(CONFIG_DIR, "lockin-session.json");
const HOSTS_MARKER = "# OPENPAW-LOCKIN";
const ROAST_PID_PATH = path.join(CONFIG_DIR, "roast-server.pid");
const ROAST_SCRIPT_PATH = "/tmp/openpaw-roast-server.js";

const ROASTS = [
	"You literally just started focusing 30 seconds ago.",
	"The internet will still be there when you're done.",
	"Your future self is judging you right now.",
	"This site isn't going anywhere. Your productivity is.",
	"Even your cat is more focused than you right now.",
	"The dopamine hit isn't worth it. Get back to work.",
	"You're not 'just checking real quick.' You never are.",
	"Your git commit count: still 0. Coincidence?",
	"If you had a dollar for every time you tried this...",
	"Focus mode exists because you can't be trusted. Exhibit A.",
	"This is exactly why we can't have nice things.",
	"Plot twist: nothing important happened on this site.",
	"Your code isn't going to write itself. Unlike this roast.",
	"Blocked. Ratio'd. Denied. Get back to work.",
	"Every second you spend here is a second you're not shipping.",
	"The only thing you should be browsing is your codebase.",
	"Nice try. Now go make something cool.",
	"This page is more productive than you were about to be.",
	"You wanted to lock in. So lock in.",
	"Remember why you started this session. It wasn't for this.",
];

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

function runAsAdmin(cmd: string): void {
	const escaped = cmd.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	execSync(
		`osascript -e 'do shell script "${escaped}" with administrator privileges'`,
		{ stdio: "pipe", timeout: 30000 },
	);
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

// ── Lock In Actions ──

export function blockSites(sites: string[]): void {
	if (sites.length === 0) return;

	const entries: string[] = [];
	for (const s of sites) {
		entries.push(`127.0.0.1 ${s} ${HOSTS_MARKER}`);
		if (!s.startsWith("www.")) entries.push(`127.0.0.1 www.${s} ${HOSTS_MARKER}`);
	}

	try {
		const tmpFile = "/tmp/openpaw-hosts-block.txt";
		fs.writeFileSync(tmpFile, entries.join("\n") + "\n");
		runAsAdmin(`cat ${tmpFile} >> /etc/hosts && rm ${tmpFile}`);
		runAsAdmin("dscacheutil -flushcache; killall -HUP mDNSResponder");
	} catch {}
}

export function unblockSites(): void {
	try {
		runAsAdmin(`sed -i '' '/${HOSTS_MARKER}/d' /etc/hosts`);
		runAsAdmin("dscacheutil -flushcache; killall -HUP mDNSResponder");
	} catch {}
}

export function quitApps(apps: string[]): void {
	for (const app of apps) {
		try {
			execSync(`osascript -e 'quit app "${app}"' 2>/dev/null`, {
				stdio: "pipe",
			});
		} catch {}
	}
}

export function enableDnd(): void {
	if (process.platform !== "darwin") return;
	try {
		execSync(
			`defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean true && killall NotificationCenter 2>/dev/null`,
			{ stdio: "pipe" },
		);
	} catch {}
}

export function disableDnd(): void {
	if (process.platform !== "darwin") return;
	try {
		execSync(
			`defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean false && killall NotificationCenter 2>/dev/null`,
			{ stdio: "pipe" },
		);
	} catch {}
}

export function enableSlackDnd(minutes: number): void {
	try {
		execSync(`slack dnd set ${minutes} 2>/dev/null`, { stdio: "pipe" });
	} catch {}
}

export function setLights(room: string, brightness: number, color?: string): void {
	try {
		let cmd = `openhue set room "${room}" --on --brightness ${brightness}`;
		if (color) cmd += ` --color "${color}"`;
		execSync(cmd, { stdio: "pipe" });
	} catch {}
}

export function connectBluetooth(device: string): void {
	try {
		if (cmdExists("blu")) {
			execSync(`blu connect "${device}" 2>/dev/null`, { stdio: "pipe", timeout: 10000 });
		}
	} catch {}
}

export function startMusic(config: { source: string; query: string }): void {
	try {
		switch (config.source) {
			case "spotify":
				execSync(`spogo search playlist "${config.query}" --play 2>/dev/null`, {
					stdio: "pipe",
					timeout: 10000,
				});
				break;
			case "apple-music":
				execSync(
					`osascript -e 'tell application "Music" to play playlist "${config.query}"' 2>/dev/null`,
					{ stdio: "pipe" },
				);
				break;
			case "sonos":
				execSync(`sonos play "${config.query}" 2>/dev/null`, {
					stdio: "pipe",
					timeout: 10000,
				});
				break;
			case "youtube": {
				// If not a URL, use ytsearch to find it
				const isUrl = config.query.startsWith("http://") || config.query.startsWith("https://");
				const ytQuery = isUrl ? config.query : `ytsearch1:${config.query}`;
				execSync(
					`yt-dlp -x --audio-format mp3 -o "/tmp/openpaw-lockin.%(ext)s" "${ytQuery}" 2>/dev/null && afplay /tmp/openpaw-lockin.mp3 &`,
					{ stdio: "pipe", timeout: 30000 },
				);
				break;
			}
			}
	} catch {}
}

export function stopMusic(source: string): void {
	try {
		switch (source) {
			case "spotify":
				execSync("spogo pause 2>/dev/null", { stdio: "pipe" });
				break;
			case "apple-music":
				execSync(`osascript -e 'tell application "Music" to pause' 2>/dev/null`, {
					stdio: "pipe",
				});
				break;
			case "sonos":
				execSync("sonos pause 2>/dev/null", { stdio: "pipe" });
				break;
		}
	} catch {}
}

export function getGitCommitCount(): number {
	try {
		const out = execSync("git rev-list --count HEAD 2>/dev/null", {
			stdio: "pipe",
		}).toString().trim();
		return parseInt(out, 10) || 0;
	} catch {
		return 0;
	}
}

export function getGitDiffStats(since: number): { commits: number; linesAdded: number; linesRemoved: number } {
	try {
		const currentCount = getGitCommitCount();
		const commits = Math.max(0, currentCount - since);
		const out = execSync(`git diff --stat HEAD~${commits} HEAD 2>/dev/null`, {
			stdio: "pipe",
		}).toString();
		const match = out.match(/(\d+) insertions?\(\+\).*?(\d+) deletions?\(-\)/);
		return {
			commits,
			linesAdded: match ? parseInt(match[1], 10) : 0,
			linesRemoved: match ? parseInt(match[2], 10) : 0,
		};
	} catch {
		return { commits: 0, linesAdded: 0, linesRemoved: 0 };
	}
}

export function getGitCommitMessages(since: number): string[] {
	try {
		const commits = Math.max(0, getGitCommitCount() - since);
		if (commits === 0) return [];
		return execSync(`git log --oneline -${commits} 2>/dev/null`, {
			stdio: "pipe",
		}).toString().trim().split("\n").filter(Boolean);
	} catch {
		return [];
	}
}

export function sendNotification(title: string, message: string): void {
	try {
		if (cmdExists("terminal-notifier")) {
			execSync(
				`terminal-notifier -title "${title}" -message "${message}" -sound default 2>/dev/null`,
				{ stdio: "pipe" },
			);
		}
	} catch {}
}

export function logToObsidian(duration: number, stats: { commits: number; linesAdded: number; linesRemoved: number }): void {
	try {
		const date = new Date().toISOString().split("T")[0];
		const time = new Date().toLocaleTimeString();
		const note = `## Lock In Session — ${date} ${time}\n- Duration: ${duration} min\n- Commits: ${stats.commits}\n- Lines: +${stats.linesAdded} / -${stats.linesRemoved}\n`;
		if (cmdExists("obsidian-cli")) {
			execSync(
				`obsidian-cli create "Lock In Log ${date}" --content "${note.replace(/"/g, '\\"')}" 2>/dev/null`,
				{ stdio: "pipe" },
			);
		}
	} catch {}
}

// ── Roast Server ──

export function startRoastServer(endsAt: string): void {
	ensureDir();

	const serverScript = `
const http = require('http');
const fs = require('fs');
const ROASTS = ${JSON.stringify(ROASTS)};
const endsAt = new Date('${"{ENDS_AT}"}');
const pidFile = '${ROAST_PID_PATH}';
const sessionFile = '${SESSION_PATH}';

fs.writeFileSync(pidFile, String(process.pid));

const server = http.createServer((req, res) => {
  const host = req.headers.host || 'blocked site';
  const site = host.replace(/:\\d+$/, '');
  const now = new Date();
  const remaining = Math.max(0, Math.round((endsAt - now) / 60000));
  const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];

  let attempts = 0;
  try {
    const session = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    session.blockedSiteAttempts = (session.blockedSiteAttempts || 0) + 1;
    attempts = session.blockedSiteAttempts;
    fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
  } catch {}

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(\`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Locked In</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#e0e0e0;font-family:-apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{text-align:center;max-width:500px;padding:3rem}
.paw{font-size:4rem;margin-bottom:1rem}
.site{color:#666;font-size:0.9rem;margin-bottom:1.5rem}
.roast{font-size:1.4rem;font-weight:600;line-height:1.4;margin-bottom:2rem;background:linear-gradient(135deg,#ff6b6b,#ffa500);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.meta{color:#555;font-size:0.85rem;margin-bottom:1.5rem}
.btn{background:#1a1a1a;border:1px solid #333;color:#888;padding:0.6rem 1.5rem;border-radius:8px;cursor:pointer;font-size:0.9rem;transition:all 0.2s}
.btn:hover{border-color:#555;color:#aaa}
</style></head><body>
<div class="card">
<div class="paw">\u{1F43E}</div>
<div class="site">\${site}</div>
<div class="roast">\${roast}</div>
<div class="meta">\${remaining} min remaining \u00b7 attempt #\${attempts}</div>
<button class="btn" onclick="window.close()">Get back to work</button>
</div></body></html>\`);
});

server.listen(80, () => {});

const checkInterval = setInterval(() => {
  if (new Date() > endsAt) {
    clearInterval(checkInterval);
    server.close();
    try { fs.unlinkSync(pidFile); } catch {}
    process.exit(0);
  }
}, 30000);
`.replace("{ENDS_AT}", endsAt);

	try {
		fs.writeFileSync(ROAST_SCRIPT_PATH, serverScript);
		runAsAdmin(`nohup node ${ROAST_SCRIPT_PATH} > /dev/null 2>&1 &`);
	} catch {}
}

export function stopRoastServer(): void {
	try {
		if (fs.existsSync(ROAST_PID_PATH)) {
			const pid = fs.readFileSync(ROAST_PID_PATH, "utf-8").trim();
			if (pid) {
				runAsAdmin(`kill ${pid}`);
			}
			fs.unlinkSync(ROAST_PID_PATH);
		}
	} catch {}
	try {
		fs.unlinkSync(ROAST_SCRIPT_PATH);
	} catch {}
}

// ── Window Management ──

export function getScreenSize(): { width: number; height: number } {
	try {
		const out = tryExec(
			`osascript -e 'tell application "Finder" to get bounds of window of desktop' 2>/dev/null`,
		);
		if (out) {
			const parts = out.split(", ").map(Number);
			if (parts.length === 4) {
				return { width: parts[2], height: parts[3] };
			}
		}
	} catch {}
	return { width: 1920, height: 1080 };
}

interface WindowPosition {
	app: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export function saveWindowPositions(): string {
	if (process.platform !== "darwin") return "[]";
	try {
		const script = `
			tell application "System Events"
				set windowList to {}
				set appList to every process whose background only is false
				repeat with proc in appList
					try
						set appName to name of proc
						repeat with win in (every window of proc)
							set {x, y} to position of win
							set {w, h} to size of win
							set end of windowList to appName & "||" & x & "||" & y & "||" & w & "||" & h
						end repeat
					end try
				end repeat
				set AppleScript's text item delimiters to "\\n"
				return windowList as text
			end tell
		`;
		const out = tryExec(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
		if (out) {
			const positions: WindowPosition[] = out
				.split("\n")
				.filter(Boolean)
				.map((line) => {
					const [app, x, y, w, h] = line.split("||");
					return { app, x: Number(x), y: Number(y), width: Number(w), height: Number(h) };
				});
			return JSON.stringify(positions);
		}
	} catch {}
	return "[]";
}

export function getFrontmostApp(): string {
	return tryExec(`osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`);
}

export function centerAndResizeApp(appName: string): void {
	if (process.platform !== "darwin") return;
	try {
		const screen = getScreenSize();
		const w = Math.floor(screen.width * 0.8);
		const h = Math.floor(screen.height * 0.8);
		const x = Math.floor((screen.width - w) / 2);
		const y = Math.floor((screen.height - h) / 2) + 25;
		execSync(
			`osascript -e 'tell application "System Events" to tell process "${appName}" to set position of front window to {${x}, ${y}}' -e 'tell application "System Events" to tell process "${appName}" to set size of front window to {${w}, ${h}}' 2>/dev/null`,
			{ stdio: "pipe", timeout: 5000 },
		);
	} catch {}
}

export function minimizeOtherWindows(keepApp: string): void {
	if (process.platform !== "darwin") return;
	try {
		execSync(
			`osascript -e '
				tell application "System Events"
					repeat with proc in (every process whose background only is false)
						if name of proc is not "${keepApp}" and name of proc is not "Finder" and name of proc is not "Dock" then
							try
								click (first button of every window of proc whose role description is "minimize button")
							end try
						end if
					end repeat
				end tell
			' 2>/dev/null`,
			{ stdio: "pipe", timeout: 10000 },
		);
	} catch {}
}

export function restoreWindows(saved: string): void {
	if (process.platform !== "darwin") return;
	try {
		const positions: WindowPosition[] = JSON.parse(saved);
		for (const pos of positions) {
			try {
				execSync(
					`osascript -e 'tell application "System Events" to tell process "${pos.app}" to set position of front window to {${pos.x}, ${pos.y}}' -e 'tell application "System Events" to tell process "${pos.app}" to set size of front window to {${pos.width}, ${pos.height}}' 2>/dev/null`,
					{ stdio: "pipe", timeout: 3000 },
				);
			} catch {}
		}
	} catch {}
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
