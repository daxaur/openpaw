import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { LEARNINGS_FILE } from "./self-learning.js";

const HOME = os.homedir();

// Secret patterns — never let these enter the learnings store.
// Ported from NousResearch/hermes-agent-self-evolution external_importers.py.
const SECRET_RE =
	/(sk-ant-api\S+|sk-or-v1-\S+|sk-[A-Za-z0-9_-]{20,}|ghp_\S+|ghu_\S+|xox[baprs]-\S+|ntn_\S+|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_.-]{20,}|-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----|\b(ANTHROPIC_API_KEY|OPENAI_API_KEY|OPENROUTER_API_KEY|SLACK_BOT_TOKEN|GITHUB_TOKEN|AWS_SECRET_ACCESS_KEY|DATABASE_URL)\b|\b(password|secret|token)\s*[=:]\s*\S{6,})/i;

export function containsSecret(text: string): boolean {
	return SECRET_RE.test(text);
}

function exists(p: string): boolean {
	try {
		return fs.existsSync(p);
	} catch {
		return false;
	}
}

export type AgentId = "hermes" | "openclaw" | "copilot" | "claude-code";

export interface AgentSource {
	id: AgentId;
	name: string;
	present: boolean;
	detail: string;
}

export interface ImportedKnowledge {
	persona?: string; // a persona/SOUL blob if the agent has one
	facts: string[]; // atomic, deduped, redacted knowledge lines
	sessions: number; // count of session transcripts found (not dumped)
}

const HERMES_DIR = path.join(HOME, ".hermes");
const OPENCLAW_DIR = path.join(HOME, ".openclaw");
const COPILOT_DIR = path.join(HOME, ".copilot", "session-state");
const CLAUDE_HISTORY = path.join(HOME, ".claude", "history.jsonl");

/** Detect which other agents have local data on this machine. */
export function detectAgents(): AgentSource[] {
	const sources: AgentSource[] = [];

	const hermesSessions = exists(path.join(HERMES_DIR, "sessions"))
		? fs
				.readdirSync(path.join(HERMES_DIR, "sessions"))
				.filter((f) => /\.jsonl?$/.test(f)).length
		: 0;
	sources.push({
		id: "hermes",
		name: "Hermes Agent",
		present: exists(HERMES_DIR),
		detail: exists(HERMES_DIR)
			? `~/.hermes (${hermesSessions} session${hermesSessions === 1 ? "" : "s"}${exists(path.join(HERMES_DIR, "SOUL.md")) ? ", SOUL.md" : ""}${exists(path.join(HERMES_DIR, "USER.md")) ? ", USER.md" : ""})`
			: "not found",
	});

	const openclawDbs = exists(path.join(OPENCLAW_DIR, "memory"))
		? fs
				.readdirSync(path.join(OPENCLAW_DIR, "memory"))
				.filter((f) => f.endsWith(".sqlite")).length
		: 0;
	sources.push({
		id: "openclaw",
		name: "OpenClaw",
		present: exists(OPENCLAW_DIR),
		detail: exists(OPENCLAW_DIR)
			? `~/.openclaw (${openclawDbs} memory db${openclawDbs === 1 ? "" : "s"})`
			: "not found",
	});

	const copilotSessions = exists(COPILOT_DIR)
		? fs.readdirSync(COPILOT_DIR).length
		: 0;
	sources.push({
		id: "copilot",
		name: "GitHub Copilot",
		present: exists(COPILOT_DIR),
		detail: exists(COPILOT_DIR)
			? `~/.copilot (${copilotSessions} session${copilotSessions === 1 ? "" : "s"})`
			: "not found",
	});

	sources.push({
		id: "claude-code",
		name: "Claude Code history",
		present: exists(CLAUDE_HISTORY),
		detail: exists(CLAUDE_HISTORY) ? "~/.claude/history.jsonl" : "not found",
	});

	return sources;
}

// Keep human-readable knowledge, drop code/logs/paths/config noise.
function looksLikeFact(s: string): boolean {
	if (s.length < 15 || s.length > 280) return false;
	if (/[{}<>]|=>|::|\$\(|\|\||&&|;\s*$|^\w+\(|`/.test(s)) return false; // code-ish
	if (/^(https?:\/\/|\/|\.\/|~\/|[A-Za-z]:\\)/.test(s)) return false; // urls/paths
	if (/^\d{1,2}:\d{2}|^\[\d|^\d{4}-\d{2}-\d{2}T/.test(s)) return false; // timestamps/logs
	const words = s.split(/\s+/).filter(Boolean);
	if (words.length < 4) return false; // not a sentence
	const alpha = (s.match(/[A-Za-z]/g) ?? []).length;
	return alpha / s.length > 0.6; // mostly prose, not symbols
}

/**
 * Turn a markdown memory blob into atomic fact-ish lines: drop headings, code
 * fences and metadata, keep bullets and substantive sentences. Long paragraphs
 * are split on sentence boundaries so each fact stays self-contained.
 */
function textToFacts(text: string): string[] {
	const out: string[] = [];
	let inFence = false;
	for (const raw of text.split("\n")) {
		const line = raw.trim();
		if (line.startsWith("```")) {
			inFence = !inFence;
			continue;
		}
		if (inFence || !line || line.startsWith("#") || line.startsWith("|") || line.startsWith("---")) continue;
		const cleaned = line.replace(/^[-*+]\s*/, "").replace(/^\d+\.\s*/, "").trim();
		if (!looksLikeFact(cleaned)) continue;
		// Split multi-sentence lines into atomic facts.
		for (const sentence of cleaned.split(/(?<=[.!?])\s+(?=[A-Z])/)) {
			const s = sentence.trim();
			if (looksLikeFact(s)) out.push(s);
		}
	}
	return out;
}

function dedupeClean(lines: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of lines) {
		const line = raw.trim();
		if (line.length < 8) continue;
		if (containsSecret(line)) continue;
		const key = line.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(line);
	}
	return out;
}

function importHermes(): ImportedKnowledge {
	const facts: string[] = [];
	let persona: string | undefined;

	const soul = path.join(HERMES_DIR, "SOUL.md");
	if (exists(soul)) persona = fs.readFileSync(soul, "utf-8").trim();

	// Curated memory lives in ~/.hermes/memories/*.md (e.g. USER.md).
	const memDir = path.join(HERMES_DIR, "memories");
	if (exists(memDir)) {
		for (const f of fs.readdirSync(memDir).filter((x) => x.endsWith(".md"))) {
			facts.push(...textToFacts(fs.readFileSync(path.join(memDir, f), "utf-8")));
		}
	}

	const sessDir = path.join(HERMES_DIR, "sessions");
	const sessions = exists(sessDir)
		? fs.readdirSync(sessDir).filter((f) => /\.jsonl?$/.test(f)).length
		: 0;

	return { persona, facts: dedupeClean(facts), sessions };
}

function importOpenClaw(): ImportedKnowledge {
	const facts: string[] = [];
	const memDir = path.join(OPENCLAW_DIR, "memory");
	if (exists(memDir)) {
		const dbs = fs.readdirSync(memDir).filter((f) => f.endsWith(".sqlite"));
		for (const db of dbs) {
			// OpenClaw stores indexed memory documents in chunks.text (FTS + vector).
			// Read via the sqlite3 CLI (no native dep). Best-effort across schema versions.
			for (const sql of ["SELECT text FROM chunks LIMIT 300;", "SELECT content FROM facts LIMIT 500;"]) {
				try {
					const out = execFileSync("sqlite3", [path.join(memDir, db), sql], {
						encoding: "utf-8",
						stdio: ["ignore", "pipe", "ignore"],
					});
					for (const blob of out.split("\n")) facts.push(...textToFacts(blob));
					break; // first query that succeeds wins
				} catch {
					// table/column absent or sqlite3 missing — try next shape, else skip.
				}
			}
		}
	}
	const agentsDir = path.join(OPENCLAW_DIR, "agents");
	let sessions = 0;
	if (exists(agentsDir)) {
		for (const a of fs.readdirSync(agentsDir)) {
			const sd = path.join(agentsDir, a, "sessions");
			if (exists(sd))
				sessions += fs
					.readdirSync(sd)
					.filter((f) => f.endsWith(".jsonl")).length;
		}
	}
	// Cap to keep the learnings store lean — the corpus is large and the rest
	// stays searchable in OpenClaw itself.
	return { facts: dedupeClean(facts).slice(0, 150), sessions };
}

function importClaudeCode(): ImportedKnowledge {
	let sessions = 0;
	if (exists(CLAUDE_HISTORY)) {
		// Count user prompts; we don't dump them as "facts" (too noisy) but report
		// the corpus size — it's available for the self-learning hook to draw on.
		sessions = fs
			.readFileSync(CLAUDE_HISTORY, "utf-8")
			.split("\n")
			.filter((l) => l.trim()).length;
	}
	return { facts: [], sessions };
}

function importCopilot(): ImportedKnowledge {
	let sessions = 0;
	if (exists(COPILOT_DIR)) sessions = fs.readdirSync(COPILOT_DIR).length;
	return { facts: [], sessions };
}

export function importAgent(id: AgentId): ImportedKnowledge {
	switch (id) {
		case "hermes":
			return importHermes();
		case "openclaw":
			return importOpenClaw();
		case "claude-code":
			return importClaudeCode();
		case "copilot":
			return importCopilot();
	}
}

export interface MigrationResult {
	factsWritten: number;
	personasFound: AgentId[]; // agent ids that had a persona
	bySource: Record<string, { facts: number; sessions: number }>;
}

/**
 * Import knowledge from the chosen agents into OpenPaw's self-learning store.
 * Facts are redacted, deduped, and appended to ~/.claude/memory/learnings.md
 * under a dated migration header. Personas are returned (not written) so the
 * caller can decide whether to seed SOUL.md.
 */
export function runMigration(
	ids: AgentId[],
	opts: { dryRun?: boolean } = {},
): MigrationResult {
	const result: MigrationResult = {
		factsWritten: 0,
		personasFound: [],
		bySource: {},
	};
	const allFacts: { source: AgentId; line: string }[] = [];

	for (const id of ids) {
		const k = importAgent(id);
		result.bySource[id] = { facts: k.facts.length, sessions: k.sessions };
		if (k.persona) result.personasFound.push(id);
		for (const line of k.facts) allFacts.push({ source: id, line });
	}

	if (opts.dryRun || allFacts.length === 0) {
		result.factsWritten = allFacts.length;
		return result;
	}

	fs.mkdirSync(path.dirname(LEARNINGS_FILE), { recursive: true });
	if (!fs.existsSync(LEARNINGS_FILE)) {
		fs.writeFileSync(
			LEARNINGS_FILE,
			"# Learnings\n\nAtomic, dated takeaways OpenPaw captured from sessions. Newest at the bottom.\n",
		);
	}

	const date = new Date().toISOString().slice(0, 10);
	const block = [`\n## Migrated ${date}\n`];
	for (const { source, line } of allFacts) {
		block.push(`- **${date}** [migrated:${source}] ${line}`);
	}
	fs.appendFileSync(LEARNINGS_FILE, `${block.join("\n")}\n`);
	result.factsWritten = allFacts.length;
	return result;
}

/** Return a persona blob for an agent (for seeding SOUL.md), redacted. */
export function getPersona(id: AgentId): string | undefined {
	const k = importAgent(id);
	if (!k.persona) return undefined;
	return k.persona
		.split("\n")
		.filter((l) => !containsSecret(l))
		.join("\n");
}
