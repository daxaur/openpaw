import * as p from "@clack/prompts";
import { accent, bold, dim, showBanner } from "../core/branding.js";
import {
	type AgentId,
	detectAgents,
	getPersona,
	runMigration,
} from "../core/migrate.js";
import { soulExists, writeSoulRaw } from "../core/soul.js";

export interface MigrateOptions {
	from?: string; // comma-separated agent ids, or "all"
	yes?: boolean;
	dryRun?: boolean;
}

const VALID: AgentId[] = ["hermes", "openclaw", "copilot", "claude-code"];

export async function migrateCommand(opts: MigrateOptions = {}): Promise<void> {
	await showBanner();
	p.intro(accent(" openpaw migrate "));

	const sources = detectAgents();
	const present = sources.filter((s) => s.present);

	if (present.length === 0) {
		p.log.warn(
			"No other assistants found on this machine (looked for Hermes, OpenClaw, Copilot, Claude Code).",
		);
		p.outro(dim("Nothing to migrate — but I'll learn as we go. 🐾"));
		return;
	}

	p.note(
		sources
			.map(
				(s) =>
					`${s.present ? "✓" : dim("○")} ${bold(s.name)}  ${dim(s.detail)}`,
			)
			.join("\n"),
		"Found these assistants",
	);

	// ── Choose sources ──
	let chosen: AgentId[];
	if (opts.from) {
		chosen =
			opts.from === "all"
				? present.map((s) => s.id)
				: (opts.from.split(",").map((x) => x.trim()) as AgentId[]).filter((x) =>
						VALID.includes(x),
					);
	} else if (opts.yes) {
		chosen = present.map((s) => s.id);
	} else {
		const sel = await p.multiselect({
			message: "Bring over what these assistants already know?",
			options: present.map((s) => ({
				value: s.id,
				label: s.name,
				hint: s.detail,
			})),
			initialValues: present.map((s) => s.id),
			required: false,
		});
		if (p.isCancel(sel)) {
			p.cancel("Ok, maybe later 🐾");
			return;
		}
		chosen = sel as AgentId[];
	}

	if (chosen.length === 0) {
		p.outro(dim("Nothing selected. 🐾"));
		return;
	}

	// ── Dry run preview ──
	const preview = runMigration(chosen, { dryRun: true });
	const previewLines = chosen.map((id) => {
		const b = preview.bySource[id];
		const personaTag = preview.personasFound.includes(id) ? ", persona" : "";
		return `${bold(id)}: ${b.facts} fact${b.facts === 1 ? "" : "s"}${personaTag}, ${b.sessions} session${b.sessions === 1 ? "" : "s"} seen`;
	});
	p.note(
		previewLines.join("\n"),
		opts.dryRun ? "Dry run — what would import" : "Ready to import",
	);

	if (opts.dryRun) {
		p.outro(accent("Dry run complete — no changes made. 🐾"));
		return;
	}

	if (!opts.yes) {
		const go = await p.confirm({
			message: "Import this into my self-learning memory?",
			initialValue: true,
		});
		if (p.isCancel(go) || !go) {
			p.cancel("Ok, nothing imported 🐾");
			return;
		}
	}

	const result = runMigration(chosen, { dryRun: false });
	p.log.success(
		`Imported ${result.factsWritten} fact${result.factsWritten === 1 ? "" : "s"} → ~/.claude/memory/learnings.md`,
	);

	// ── Persona offer ──
	if (result.personasFound.length > 0 && !opts.yes) {
		const src = result.personasFound[0];
		const persona = getPersona(src);
		if (persona) {
			const seed =
				soulExists() === false
					? await p.confirm({
							message: `Use ${src}'s persona to seed your SOUL.md?`,
							initialValue: true,
						})
					: await p.confirm({
							message: `You already have a SOUL.md. Overwrite it with ${src}'s persona?`,
							initialValue: false,
						});
			if (!p.isCancel(seed) && seed) {
				writeSoulRaw(persona);
				p.log.success("Persona written to ~/.claude/SOUL.md");
			}
		}
	}

	p.outro(
		accent(
			"Migration complete — I remember what you taught your last assistant. 🐾",
		),
	);
}
