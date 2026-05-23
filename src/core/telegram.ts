import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as p from "@clack/prompts";
import type { TelegramConfig } from "../types.js";
import { accent, bold, dim } from "./branding.js";

// OpenPaw uses the official Claude Code Telegram plugin
// (telegram@claude-plugins-official) instead of a homegrown bot. We only
// install + configure it: write the bot token and an allowlist, then the
// plugin runs the bridge as a channel inside Claude Code itself — same model,
// same skills, same permissions as your terminal session. No second process,
// no drift, no custom session handling to go stale.

const PLUGIN_SPEC = "telegram@claude-plugins-official";
const CHANNEL_DIR = path.join(os.homedir(), ".claude", "channels", "telegram");
const ENV_FILE = path.join(CHANNEL_DIR, ".env");
const ACCESS_FILE = path.join(CHANNEL_DIR, "access.json");

// ── Config (written to the official plugin's own locations) ──

export function writeTelegramConfig(config: TelegramConfig): void {
	fs.mkdirSync(CHANNEL_DIR, { recursive: true, mode: 0o700 });

	// Bot token → .env (the plugin reads TELEGRAM_BOT_TOKEN from here).
	fs.writeFileSync(ENV_FILE, `TELEGRAM_BOT_TOKEN=${config.botToken}\n`, {
		mode: 0o600,
	});

	// Allowlist → access.json. allowlist mode = only these user IDs get through;
	// DMs from anyone else are dropped (no open pairing).
	const access = {
		dmPolicy: "allowlist",
		allowFrom: config.allowedUserIds,
		groups: {},
		pending: {},
		mentionPatterns: ["paw"],
	};
	fs.writeFileSync(ACCESS_FILE, JSON.stringify(access, null, 2), {
		mode: 0o600,
	});
}

export function readTelegramConfig(): TelegramConfig | null {
	try {
		const env = fs.readFileSync(ENV_FILE, "utf-8");
		const token = env.match(/TELEGRAM_BOT_TOKEN=(.+)/)?.[1]?.trim();
		if (!token) return null;

		let allowedUserIds: string[] = [];
		try {
			const access = JSON.parse(fs.readFileSync(ACCESS_FILE, "utf-8"));
			if (Array.isArray(access.allowFrom))
				allowedUserIds = access.allowFrom.map(String);
		} catch {}

		return {
			botToken: token,
			allowedUserIds,
			workspaceDir: os.homedir(),
			model: "sonnet",
			skills: [],
		};
	} catch {
		return null;
	}
}

export function telegramConfigExists(): boolean {
	return fs.existsSync(ENV_FILE);
}

// ── Wizard Questionnaire ──

export async function telegramQuestionnaire(): Promise<TelegramConfig | null> {
	p.log.info(dim("Let's set up your Telegram bot! You'll need:"));
	p.log.info(
		`  ${accent("1.")} Message ${bold("@BotFather")} on Telegram → /newbot`,
	);
	p.log.info(
		`  ${accent("2.")} Message ${bold("@userinfobot")} to get your user ID`,
	);
	console.log("");

	const botToken = await p.text({
		message: "Paste your bot token (from @BotFather):",
		placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
		validate: (v) => {
			if (v.length === 0) return "Bot token is required";
			if (!v.includes(":"))
				return "That doesn't look like a bot token (should contain ':')";
			return undefined;
		},
	});
	if (p.isCancel(botToken)) return null;

	const userId = await p.text({
		message: "Your Telegram user ID (from @userinfobot):",
		placeholder: "123456789",
		validate: (v) => {
			if (v.length === 0) return "User ID is required";
			if (!/^\d+$/.test(v)) return "User ID should be a number";
			return undefined;
		},
	});
	if (p.isCancel(userId)) return null;

	return {
		botToken: botToken as string,
		allowedUserIds: [(userId as string).trim()],
		workspaceDir: os.homedir(),
		model: "sonnet",
		skills: [],
	};
}

// ── Official plugin management ──

export function telegramPluginInstalled(): boolean {
	try {
		const out = execSync("claude plugin list", {
			encoding: "utf-8",
			stdio: ["ignore", "pipe", "ignore"],
		});
		if (out.includes("telegram@claude-plugins-official")) return true;
	} catch {}
	// Fallback: the plugin cache dir exists.
	return fs.existsSync(
		path.join(
			os.homedir(),
			".claude",
			"plugins",
			"cache",
			"claude-plugins-official",
			"telegram",
		),
	);
}

/** Install the official Telegram plugin via the Claude Code CLI. */
export function installTelegramPlugin(): boolean {
	try {
		execSync(`claude plugin install ${PLUGIN_SPEC}`, { stdio: "ignore" });
		return telegramPluginInstalled();
	} catch {
		return false;
	}
}

/** Enable the plugin (idempotent; ignored if already enabled). */
export function enableTelegramPlugin(): void {
	try {
		execSync(`claude plugin enable ${PLUGIN_SPEC}`, { stdio: "ignore" });
	} catch {}
}

/**
 * Ensure the official plugin is installed, configured, and enabled.
 * Returns a human-readable status for the wizard/CLI to print.
 */
export function ensureTelegramReady(): { ok: boolean; message: string } {
	if (!telegramConfigExists()) {
		return {
			ok: false,
			message: "No Telegram config yet — run `openpaw telegram setup`.",
		};
	}
	if (!telegramPluginInstalled()) {
		if (!installTelegramPlugin()) {
			return {
				ok: false,
				message: `Couldn't auto-install the plugin. Install it once with:\n  claude plugin install ${PLUGIN_SPEC}`,
			};
		}
	}
	enableTelegramPlugin();
	return {
		ok: true,
		message: "Telegram bridge ready — it runs inside Claude Code.",
	};
}
