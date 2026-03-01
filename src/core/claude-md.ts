import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { skills as catalog } from "../catalog/index.js";
import { listInstalledSkills } from "./skills.js";
import { readConfig as readDashboardConfig } from "./dashboard-server.js";
import type { Skill } from "../types.js";

const START_MARKER = "<!-- OPENPAW:START -->";
const END_MARKER = "<!-- OPENPAW:END -->";

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

function generateSection(
	botName: string,
	installedSkills: Skill[],
	hasDashboard: boolean,
): string {
	const lines: string[] = [
		START_MARKER,
		"",
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
		lines.push("Use `/c <request>` to route through the coordinator, or talk naturally.");
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
	lines.push(END_MARKER);

	return lines.join("\n");
}

/**
 * Write or update the OpenPaw section in ~/.claude/CLAUDE.md.
 *
 * If CLAUDE.md already exists, only the content between
 * <!-- OPENPAW:START --> and <!-- OPENPAW:END --> is replaced.
 * Everything else (user's own instructions) is preserved.
 *
 * If no markers exist yet, the section is appended to the end.
 * If the file doesn't exist, it's created with just the OpenPaw section.
 */
export function writeClaudeMd(
	botName: string,
	installedSkills: Skill[],
	hasDashboard: boolean,
): void {
	const dir = path.dirname(getClaudeMdPath());
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const section = generateSection(botName, installedSkills, hasDashboard);
	const filePath = getClaudeMdPath();

	if (!fs.existsSync(filePath)) {
		// No existing file — create with just our section
		fs.writeFileSync(filePath, section + "\n", "utf-8");
		return;
	}

	const existing = fs.readFileSync(filePath, "utf-8");
	const startIdx = existing.indexOf(START_MARKER);
	const endIdx = existing.indexOf(END_MARKER);

	if (startIdx !== -1 && endIdx !== -1) {
		// Replace existing section
		const before = existing.slice(0, startIdx);
		const after = existing.slice(endIdx + END_MARKER.length);
		fs.writeFileSync(filePath, before + section + after, "utf-8");
	} else {
		// No markers found — append to end
		const separator = existing.endsWith("\n") ? "\n" : "\n\n";
		fs.writeFileSync(filePath, existing + separator + section + "\n", "utf-8");
	}
}

/**
 * Regenerate the OpenPaw section in CLAUDE.md from current state.
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
