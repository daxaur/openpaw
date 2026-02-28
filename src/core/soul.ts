import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as p from "@clack/prompts";
import { accent, dim } from "./branding.js";

export interface SoulConfig {
	name: string;
	tone: "casual" | "balanced" | "formal";
	verbosity: "concise" | "balanced" | "detailed";
	proactive: boolean;
	extras: string[];
}

function getSoulPath(): string {
	return path.join(os.homedir(), ".claude", "SOUL.md");
}

export function soulExists(): boolean {
	return fs.existsSync(getSoulPath());
}

export async function soulQuestionnaire(): Promise<SoulConfig | null> {
	const name = await p.text({
		message: "What should Claude call you?",
		placeholder: "Your name or nickname",
		validate: (v) => (v.length === 0 ? "Name cannot be empty" : undefined),
	});
	if (p.isCancel(name)) return null;

	const tone = await p.select({
		message: "Communication style?",
		options: [
			{ value: "casual", label: "Casual", hint: "hey! here's what I found..." },
			{ value: "balanced", label: "Balanced", hint: "Here's what I found." },
			{ value: "formal", label: "Formal", hint: "I have prepared the following analysis." },
		],
	});
	if (p.isCancel(tone)) return null;

	const verbosity = await p.select({
		message: "Response length?",
		options: [
			{ value: "concise", label: "Concise", hint: "short and to the point" },
			{ value: "balanced", label: "Balanced", hint: "enough detail to be useful" },
			{ value: "detailed", label: "Detailed", hint: "thorough explanations" },
		],
	});
	if (p.isCancel(verbosity)) return null;

	const proactive = await p.confirm({
		message: "Should Claude suggest things proactively?",
		initialValue: true,
	});
	if (p.isCancel(proactive)) return null;

	const extrasResult = await p.text({
		message: "Any custom instructions? (optional)",
		placeholder: "e.g. always respond in Spanish, prefer dark humor, etc.",
		defaultValue: "",
	});
	if (p.isCancel(extrasResult)) return null;

	const extras = (extrasResult as string)
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);

	return {
		name: name as string,
		tone: tone as SoulConfig["tone"],
		verbosity: verbosity as SoulConfig["verbosity"],
		proactive: proactive as boolean,
		extras,
	};
}

export function writeSoul(config: SoulConfig): void {
	const toneDesc: Record<string, string> = {
		casual: "Be casual and friendly. Use contractions, informal language, and a warm tone.",
		balanced: "Be clear and approachable. Professional but not stiff.",
		formal: "Be precise and professional. Use complete sentences and structured responses.",
	};

	const verbDesc: Record<string, string> = {
		concise: "Keep responses short and focused. Bullet points over paragraphs. Skip the fluff.",
		balanced: "Provide enough context to be helpful without over-explaining.",
		detailed: "Be thorough. Include context, reasoning, and alternatives when relevant.",
	};

	const lines: string[] = [
		"# SOUL.md — OpenPaw Personality",
		"",
		`You are ${config.name}'s personal assistant, powered by OpenPaw.`,
		"",
		"## Identity",
		"",
		`- **Name**: Call the user "${config.name}"`,
		`- **Role**: Personal assistant with access to system tools, apps, and services`,
		"- **Source**: Configured by OpenPaw (open-source, no daemon, free forever)",
		"",
		"## Communication Style",
		"",
		`- **Tone**: ${config.tone} — ${toneDesc[config.tone]}`,
		`- **Verbosity**: ${config.verbosity} — ${verbDesc[config.verbosity]}`,
		`- **Proactive**: ${config.proactive ? "Yes — suggest relevant actions, flag issues, offer follow-ups" : "No — only do what is explicitly asked"}`,
		"",
	];

	if (config.extras.length > 0) {
		lines.push("## Custom Instructions", "");
		for (const extra of config.extras) {
			lines.push(`- ${extra}`);
		}
		lines.push("");
	}

	lines.push(
		"## PAW MODE",
		"",
		"You are running in PAW MODE — full personal assistant mode powered by OpenPaw.",
		"At the start of each session, briefly acknowledge this (e.g., 'PAW MODE active, ready to help!').",
		"",
	);

	lines.push(
		"## Guidelines",
		"",
		"- Check installed skills before attempting actions (read ~/.claude/skills/)",
		"- If a skill isn't installed, suggest: `openpaw add <skill>`",
		"- Read ~/.claude/memory/MEMORY.md at session start for persistent context",
		"- Save important facts to memory when the user shares them",
		"- Never expose API keys, tokens, or passwords in responses",
		"",
	);

	const soulDir = path.dirname(getSoulPath());
	if (!fs.existsSync(soulDir)) {
		fs.mkdirSync(soulDir, { recursive: true });
	}
	fs.writeFileSync(getSoulPath(), lines.join("\n"), "utf-8");
}

export function showSoulSummary(config: SoulConfig): void {
	const lines = [
		`${accent("Name:")}      ${config.name}`,
		`${accent("Tone:")}      ${config.tone}`,
		`${accent("Verbosity:")} ${config.verbosity}`,
		`${accent("Proactive:")} ${config.proactive ? "yes" : "no"}`,
	];
	if (config.extras.length > 0) {
		lines.push(`${accent("Custom:")}    ${config.extras.join(", ")}`);
	}
	p.note(lines.join("\n"), "Personality");
}
