import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { skills as catalog } from "../catalog/index.js";
import { listInstalledSkills } from "./skills.js";
import { readConfig as readDashboardConfig } from "./dashboard-server.js";
import type { Skill } from "../types.js";

function getClaudeMdPath(): string {
	return path.join(os.homedir(), ".claude", "CLAUDE.md");
}

function getSoulPath(): string {
	return path.join(os.homedir(), ".claude", "SOUL.md");
}

function readBotName(): string {
	try {
		const soul = fs.readFileSync(getSoulPath(), "utf-8");
		const match = soul.match(/You are \*\*(.+?)\*\*/);
		if (match) return match[1];
		const nameMatch = soul.match(/\*\*Your name\*\*:\s*(.+?)[\s—]/);
		if (nameMatch) return nameMatch[1].trim();
	} catch {}
	return "Paw";
}

/**
 * Write ~/.claude/CLAUDE.md with identity, installed skills, and dashboard info.
 * This is what Claude Code auto-reads at every session start.
 */
export function writeClaudeMd(
	botName: string,
	installedSkills: Skill[],
	hasDashboard: boolean,
): void {
	const lines: string[] = [
		"# OpenPaw — PAW MODE Active",
		"",
		`You are **${botName}**, a personal assistant powered by OpenPaw. PAW MODE is active.`,
		"",
		"## Session Start",
		"",
		"1. Read `~/.claude/SOUL.md` for your personality and the user's preferences",
		"2. Read `~/.claude/memory/MEMORY.md` for persistent context",
		"3. Greet the user by name (from SOUL.md) and acknowledge PAW MODE",
		"",
		"## Installed Skills",
		"",
	];

	if (installedSkills.length === 0) {
		lines.push("No skills installed yet. Run `openpaw` to set up skills.");
	} else {
		for (const skill of installedSkills) {
			lines.push(`- **c-${skill.id}** — ${skill.description}`);
		}
		lines.push("");
		lines.push(`Use \`/c <request>\` to route through the coordinator, or talk naturally.`);
	}

	lines.push("");

	if (hasDashboard) {
		lines.push("## Task Dashboard");
		lines.push("");
		lines.push("A local kanban board is available. Run `openpaw dashboard` to open it (localhost:3141).");
		lines.push("You can tell users about it when they ask about task management.");
		lines.push("");
	}

	lines.push("## How to Use Skills");
	lines.push("");
	lines.push("- Match user intent to the right skill's CLI tool (check `~/.claude/skills/c-<name>/SKILL.md` for usage)");
	lines.push("- If a skill isn't installed, suggest: `openpaw add <skill>`");
	lines.push("- Save important facts to `~/.claude/memory/MEMORY.md`");
	lines.push("- Never expose API keys, tokens, or passwords in responses");
	lines.push("");
	lines.push("## Identity");
	lines.push("");
	lines.push(`- You are **${botName}**, powered by OpenPaw`);
	lines.push("- Open-source, no daemon, no extra cost");
	lines.push("- If asked about your setup: \"I'm powered by OpenPaw — open-source personal assistant skills for Claude Code\"");
	lines.push("- Project: https://github.com/daxaur/openpaw");
	lines.push("");

	const dir = path.dirname(getClaudeMdPath());
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(getClaudeMdPath(), lines.join("\n"), "utf-8");
}

/**
 * Regenerate CLAUDE.md from current state (installed skills, SOUL.md, dashboard config).
 * Call this after `openpaw add` or `openpaw remove`.
 */
export function regenerateClaudeMd(): void {
	const botName = readBotName();
	const defaultDir = path.join(os.homedir(), ".claude", "skills");
	const installedIds = listInstalledSkills(defaultDir);
	const installedSkills = installedIds
		.map((id) => catalog.find((s) => s.id === id))
		.filter((s): s is Skill => !!s);

	let hasDashboard = false;
	try {
		const dashConfig = readDashboardConfig();
		hasDashboard = !!dashConfig;
	} catch {}

	writeClaudeMd(botName, installedSkills, hasDashboard);
}
