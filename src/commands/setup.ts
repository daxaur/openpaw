import * as p from "@clack/prompts";
import chalk from "chalk";
import { execSync } from "node:child_process";
import { skills, categoryLabels, getSkillsByCategory, getPresetSkills, presets, getAllTaps, getSkillById } from "../catalog/index.js";
import { detectPlatform } from "../core/platform.js";
import { showBanner, pawStep, pawPulse, accent, subtle, dim, bold } from "../core/branding.js";
import { installTaps, getMissingTools, installTool } from "../core/installer.js";
import { installSkill, getDefaultSkillsDir } from "../core/skills.js";
import { addPermissions } from "../core/permissions.js";
import { installSafetyHooks } from "../core/hooks.js";
import { mcpServers, installMcpServer, type McpServer } from "../core/mcp.js";
import { soulQuestionnaire, writeSoul, showSoulSummary, soulExists } from "../core/soul.js";
import { setupMemory } from "../core/memory.js";
import type { CliTool, Skill } from "../types.js";

// Category icons for the wizard
const CATEGORY_ICONS: Record<string, string> = {
	productivity: "📝",
	communication: "💬",
	media: "🎵",
	"smart-home": "🏠",
	research: "🔍",
	developer: "⚡",
	automation: "🤖",
	system: "⚙️",
};

export interface SetupOptions {
	preset?: string;
	yes?: boolean;
	dryRun?: boolean;
}

export async function setupCommand(opts: SetupOptions = {}): Promise<void> {
	await showBanner();

	const platform = detectPlatform();
	p.intro(accent(" openpaw setup "));

	// ── Step 1: Platform ──
	const brewStatus = platform.hasBrew ? chalk.green("✓ brew") : chalk.red("✗ brew");
	const npmStatus = platform.hasNpm ? chalk.green("✓ npm") : chalk.red("✗ npm");
	p.log.info(`${chalk.bold(platform.osName)} ${platform.osVersion}  ${brewStatus}  ${npmStatus}`);

	if (!platform.hasBrew && platform.os === "darwin") {
		p.log.warn("Homebrew is required for most tools → https://brew.sh");
	}

	// ── Step 2: Personality (SOUL.md) ──
	if (!opts.yes && !soulExists()) {
		await pawPulse("think", "Let's personalize your assistant...");

		const wantSoul = await p.confirm({
			message: "Set up a personality for Claude? (name, tone, preferences)",
			initialValue: true,
		});

		if (!p.isCancel(wantSoul) && wantSoul) {
			const soul = await soulQuestionnaire();
			if (soul) {
				writeSoul(soul);
				setupMemory(soul.name);
				showSoulSummary(soul);
				p.log.success("Personality saved to ~/.claude/SOUL.md");
			}
		} else {
			// Still set up memory without a name
			setupMemory();
		}
	} else if (opts.yes) {
		setupMemory();
	}

	// ── Step 3: Skill Selection (preset or custom) ──
	let selectedSkills: Skill[];

	if (opts.preset) {
		selectedSkills = getPresetSkills(opts.preset, platform.os);
		if (selectedSkills.length === 0) {
			p.log.error(`Unknown preset: ${opts.preset}`);
			p.log.info(`Available: ${presets.map((pr) => pr.id).join(", ")}`);
			process.exit(1);
		}
		p.log.info(`Using preset: ${bold(opts.preset)} (${selectedSkills.length} skills)`);
	} else {
		selectedSkills = await selectSkills(platform.os);
	}

	if (selectedSkills.length === 0) {
		p.log.warn("No skills selected. Run openpaw again when ready.");
		p.outro("See you later!");
		return;
	}

	// Resolve dependencies
	const resolved = resolveDependencies(selectedSkills);
	if (resolved.length > 0) {
		const depNames = resolved.map((s) => s.name).join(", ");
		p.log.info(`${dim("Auto-adding dependencies:")} ${depNames}`);
		selectedSkills.push(...resolved);
	}

	await pawPulse("happy", `${selectedSkills.length} skill${selectedSkills.length > 1 ? "s" : ""} selected`);

	// ── Step 4: Sub-Choices ──
	if (!opts.yes) {
		for (const skill of selectedSkills) {
			if (skill.subChoices) {
				const choice = await p.select({
					message: `${skill.name}: ${skill.subChoices.question}`,
					options: skill.subChoices.options.map((o) => ({
						value: o.value,
						label: o.label,
					})),
				});

				if (p.isCancel(choice)) {
					p.cancel("Setup cancelled.");
					process.exit(0);
				}

				const chosen = skill.subChoices.options.find((o) => o.value === choice);
				if (chosen) {
					skill.tools = chosen.tools;
				}
			}
		}
	} else {
		for (const skill of selectedSkills) {
			if (skill.subChoices && skill.tools.length === 0) {
				skill.tools = skill.subChoices.options[0].tools;
			}
		}
	}

	// ── Collect tools ──
	const allTools: CliTool[] = [];
	for (const skill of selectedSkills) {
		allTools.push(...skill.tools);
	}
	const uniqueTools = [...new Map(allTools.map((t) => [t.command, t])).values()];
	const taps = getAllTaps(selectedSkills);
	const missing = getMissingTools(uniqueTools);

	// ── Step 5: Install Location ──
	let targetDir: string;
	if (opts.yes) {
		targetDir = getDefaultSkillsDir();
	} else {
		targetDir = await selectInstallLocation();
	}

	// ── Step 6: Confirmation ──
	const summary = buildSummary(selectedSkills, uniqueTools, missing, taps);
	p.note(summary, "Installation summary");

	if (!opts.yes) {
		const proceed = await p.confirm({
			message: "Proceed with installation?",
			initialValue: true,
		});

		if (p.isCancel(proceed) || !proceed) {
			p.cancel("Setup cancelled.");
			process.exit(0);
		}
	}

	// ── Step 7: Dry Run ──
	if (opts.dryRun) {
		p.log.info(dim("Dry run — no changes made."));
		p.outro(accent("openpaw dry run complete"));
		return;
	}

	// ── Step 8: Installation ──
	await pawStep("work", "Installing...");

	const s = p.spinner();

	if (taps.size > 0) {
		s.start("🐾 Adding Homebrew taps...");
		const tapResults = installTaps(taps);
		const failed = [...tapResults].filter(([, ok]) => !ok);
		if (failed.length > 0) {
			s.stop(`Taps: ${taps.size - failed.length} added, ${failed.length} failed`);
		} else {
			s.stop(`🐾 ${taps.size} tap${taps.size > 1 ? "s" : ""} ready`);
		}
	}

	if (missing.length > 0) {
		for (let i = 0; i < missing.length; i++) {
			const tool = missing[i];
			s.start(`🐾 [${i + 1}/${missing.length}] Installing ${tool.name}...`);
			const result = installTool(tool);
			if (result.success) {
				s.stop(`${chalk.green("✓")} ${tool.name}`);
			} else {
				s.stop(`${chalk.red("✗")} ${tool.name} — ${result.error?.slice(0, 50)}`);
			}
		}
	} else if (uniqueTools.length > 0) {
		p.log.success("All tools already installed");
	}

	s.start("🐾 Creating skills...");
	installSkill("core", targetDir);
	installSkill("memory", targetDir);
	const installed: string[] = ["c-core", "c-memory"];
	for (const skill of selectedSkills) {
		if (installSkill(skill.id, targetDir)) installed.push(`c-${skill.id}`);
	}
	s.stop(`🐾 ${installed.length} skills created`);

	s.start("🐾 Configuring permissions...");
	const added = addPermissions(uniqueTools);
	s.stop(added.length > 0 ? `🐾 ${added.length} permission${added.length > 1 ? "s" : ""} added` : "🐾 Permissions up to date");

	s.start("🐾 Installing safety hooks...");
	const hooksOk = installSafetyHooks();
	s.stop(hooksOk ? "🐾 Safety hooks active" : "🐾 Safety hooks failed (non-critical)");

	// ── Step 8b: MCP Servers ──
	if (!opts.yes) {
		const wantMcp = await p.confirm({
			message: "Set up MCP servers? (optional — adds AI tools like search, memory, browser)",
			initialValue: false,
		});

		if (!p.isCancel(wantMcp) && wantMcp) {
			const mcpChoices = await p.multiselect({
				message: "🔌 MCP Servers",
				options: mcpServers.map((srv) => ({
					value: srv.id,
					label: srv.name,
					hint: srv.description,
				})),
				required: false,
			});

			if (!p.isCancel(mcpChoices)) {
				const chosen = mcpChoices as string[];
				if (chosen.length > 0) {
					s.start("🐾 Configuring MCP servers...");
					let mcpCount = 0;
					for (const id of chosen) {
						const srv = mcpServers.find((m) => m.id === id);
						if (srv && installMcpServer(srv)) mcpCount++;
					}
					s.stop(`🐾 ${mcpCount} MCP server${mcpCount > 1 ? "s" : ""} configured`);

					// Show env vars that need filling in
					const needsEnv = chosen
						.map((id) => mcpServers.find((m) => m.id === id))
						.filter((srv): srv is McpServer => !!srv?.envPlaceholders);

					if (needsEnv.length > 0) {
						const envList = needsEnv
							.flatMap((srv) =>
								Object.entries(srv.envPlaceholders!).map(
									([key, placeholder]) =>
										`${chalk.yellow("→")} ${bold(srv.name)}: Set ${dim(key)} in ~/.claude/settings.json`,
								),
							)
							.join("\n");
						p.note(envList, "MCP servers need API keys");
					}
				}
			}
		}
	}

	// ── Step 9: Auth Reminders ──
	const authSteps = selectedSkills
		.flatMap((skill) => skill.authSteps ?? [])
		.filter((step, i, arr) => arr.findIndex((s) => s.command === step.command) === i);

	if (authSteps.length > 0) {
		const authList = authSteps
			.map((st) => `${chalk.yellow("→")} ${chalk.bold(st.command)}  ${dim(st.description)}`)
			.join("\n");
		p.note(authList, "One-time auth needed");
	}

	// ── Step 10: Done + Launch ──
	await pawStep("done", "Setup complete!");

	console.log("");
	console.log(dim("  Open Claude Code and try:"));
	console.log(`  ${subtle('"What are my latest emails?"')}`);
	console.log(`  ${subtle('"Play some jazz on Spotify"')}`);
	console.log(`  ${subtle('"Go to hacker news and summarize the top posts"')}`);
	console.log("");

	// Offer to launch Claude Code
	if (!opts.yes) {
		const launch = await p.confirm({
			message: "Launch Claude Code now?",
			initialValue: true,
		});

		if (!p.isCancel(launch) && launch) {
			p.outro(accent("Starting Claude Code..."));
			try {
				execSync("claude", { stdio: "inherit" });
			} catch {
				p.log.warn("Could not launch Claude Code. Make sure it's installed: https://claude.ai/code");
			}
			return;
		}
	}

	p.outro(accent("openpaw setup complete 🐾"));
}

// ── Skill Selection ──

async function selectSkills(os: string): Promise<Skill[]> {
	const mode = await p.select({
		message: "How would you like to set up?",
		options: [
			{ value: "preset", label: "⚡ Quick Setup", hint: "pick a preset, get going fast" },
			{ value: "custom", label: "🎯 Custom", hint: "choose skills category by category" },
		],
	});

	if (p.isCancel(mode)) {
		p.cancel("Setup cancelled.");
		process.exit(0);
	}

	if (mode === "preset") {
		return await selectFromPreset(os);
	}
	return await selectCustom(os);
}

async function selectFromPreset(os: string): Promise<Skill[]> {
	const presetChoice = await p.select({
		message: "Choose a preset",
		options: presets.map((pr) => ({
			value: pr.id,
			label: pr.name,
			hint: pr.description,
		})),
	});

	if (p.isCancel(presetChoice)) {
		p.cancel("Setup cancelled.");
		process.exit(0);
	}

	const presetSkills = getPresetSkills(presetChoice as string, os);
	const skillNames = presetSkills.map((s) => s.name).join(", ");
	p.log.info(`${dim("Includes:")} ${skillNames}`);

	return presetSkills;
}

async function selectCustom(os: string): Promise<Skill[]> {
	const grouped = getSkillsByCategory(os);
	const allSelected: Skill[] = [];

	// Walk through each category one at a time
	for (const [category, categorySkills] of grouped) {
		const label = categoryLabels[category] ?? category;
		const icon = CATEGORY_ICONS[category] ?? "📦";

		const selected = await p.multiselect({
			message: `${icon} ${label}`,
			options: categorySkills.map((skill) => ({
				value: skill.id,
				label: skill.name,
				hint: skill.description,
			})),
			required: false,
		});

		if (p.isCancel(selected)) {
			p.cancel("Setup cancelled.");
			process.exit(0);
		}

		const ids = selected as string[];
		for (const id of ids) {
			const skill = skills.find((s) => s.id === id);
			if (skill) allSelected.push(skill);
		}

		if (ids.length > 0) {
			p.log.step(`${ids.length} selected from ${label}`);
		}
	}

	return allSelected;
}

// ── Install Location ──

async function selectInstallLocation(): Promise<string> {
	const defaultDir = getDefaultSkillsDir();
	const skillsDir = await p.select({
		message: "Where should skills live?",
		options: [
			{ value: defaultDir, label: `Global ${dim("~/.claude/skills/")}`, hint: "recommended" },
			{ value: ".claude/skills", label: `Project ${dim(".claude/skills/")}` },
			{ value: "custom", label: "Custom path" },
		],
	});

	if (p.isCancel(skillsDir)) {
		p.cancel("Setup cancelled.");
		process.exit(0);
	}

	let targetDir = skillsDir as string;
	if (targetDir === "custom") {
		const customDir = await p.text({
			message: "Skills directory path:",
			placeholder: "~/.claude/skills",
			validate: (v) => (v.length === 0 ? "Path cannot be empty" : undefined),
		});
		if (p.isCancel(customDir)) {
			p.cancel("Setup cancelled.");
			process.exit(0);
		}
		targetDir = customDir as string;
	}

	return targetDir;
}

// ── Summary ──

function buildSummary(
	selectedSkills: Skill[],
	uniqueTools: CliTool[],
	missing: CliTool[],
	taps: Set<string>,
): string {
	const lines: string[] = [];
	lines.push(`${bold("Skills:")}    ${selectedSkills.map((s) => s.name).join(", ")}`);
	lines.push(`${bold("Tools:")}     ${uniqueTools.length} total, ${missing.length} to install`);
	if (taps.size > 0) {
		lines.push(`${bold("Taps:")}      ${[...taps].join(", ")}`);
	}
	lines.push(`${bold("Memory:")}    ~/.claude/memory/`);
	lines.push(`${bold("Soul:")}      ~/.claude/SOUL.md`);
	return lines.join("\n");
}

// ── Dependency Resolution ──

function resolveDependencies(selectedSkills: Skill[]): Skill[] {
	const selectedIds = new Set(selectedSkills.map((s) => s.id));
	const added: Skill[] = [];

	for (const skill of selectedSkills) {
		if (!skill.depends) continue;
		for (const depId of skill.depends) {
			if (!selectedIds.has(depId)) {
				const dep = getSkillById(depId);
				if (dep) {
					added.push(dep);
					selectedIds.add(depId);
				}
			}
		}
	}

	return added;
}
