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
	hasSelfControl: boolean;
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
		hasSelfControl: false,
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

	// SelfControl
	caps.hasSelfControl = fs.existsSync("/Applications/SelfControl.app");

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
