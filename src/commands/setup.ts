import * as p from "@clack/prompts";
import * as os from "node:os";
import chalk from "chalk";
import { execSync } from "node:child_process";
import { skills, categoryLabels, getSkillsByCategory, getPresetSkills, presets, getAllTaps, getSkillById } from "../catalog/index.js";
import { detectPlatform } from "../core/platform.js";
import { showBanner, pawStep, pawPulse, showPuppyDisclaimer, accent, subtle, dim, bold } from "../core/branding.js";
import { installTaps, getMissingTools, installTool } from "../core/installer.js";
import { installSkill, getDefaultSkillsDir } from "../core/skills.js";
import { addPermissions } from "../core/permissions.js";
import { installSafetyHooks } from "../core/hooks.js";
import { mcpServers, installMcpServer, type McpServer } from "../core/mcp.js";
import { soulQuestionnaire, writeSoul, showSoulSummary, soulExists } from "../core/soul.js";
import { setupMemory } from "../core/memory.js";
import { telegramQuestionnaire, writeTelegramConfig, telegramConfigExists } from "../core/telegram.js";
import { isTmuxAvailable, isInTmux, launchInTmux, launchInBackground } from "../core/tmux.js";
import type { CliTool, InterfaceMode, Skill, TelegramConfig } from "../types.js";

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
		await pawPulse("think", "Let's get to know you...");

		const wantSoul = await p.confirm({
			message: "Teach me your name and preferences? (makes me a better pup)",
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
		p.log.warn("No skills selected. Run openpaw again when you're ready!");
		p.outro("I'll be here napping... come back soon! 🐾");
		return;
	}

	// Resolve dependencies
	const resolved = resolveDependencies(selectedSkills);
	if (resolved.length > 0) {
		const depNames = resolved.map((s) => s.name).join(", ");
		p.log.info(`${dim("Auto-fetching dependencies:")} ${depNames}`);
		selectedSkills.push(...resolved);
	}

	await pawPulse("happy", `${selectedSkills.length} skill${selectedSkills.length > 1 ? "s" : ""} selected — good taste!`);

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
					p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
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

	// ── Step 5: Interface Mode ──
	let interfaceMode: InterfaceMode = "native";
	let telegramConfig: TelegramConfig | null = null;

	if (!opts.yes) {
		const modeChoice = await p.select({
			message: "How do you want to talk to Claude? 🐾",
			options: [
				{ value: "native", label: "🖥  Terminal only", hint: "Claude Code in your terminal" },
				{ value: "telegram", label: "📱 Telegram", hint: "talk to Claude from your phone" },
				{ value: "both", label: "🖥📱 Both", hint: "terminal + Telegram" },
			],
		});

		if (p.isCancel(modeChoice)) {
			p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
			process.exit(0);
		}

		interfaceMode = modeChoice as InterfaceMode;

		// Telegram setup
		if (interfaceMode === "telegram" || interfaceMode === "both") {
			if (telegramConfigExists()) {
				p.log.info(dim("Telegram already configured — keeping existing config"));
			} else {
				telegramConfig = await telegramQuestionnaire();
				if (!telegramConfig) {
					p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
					process.exit(0);
				}
			}

			// Auto-add telegram skill if not already selected
			if (!selectedSkills.find((s) => s.id === "telegram")) {
				const tgSkill = skills.find((s) => s.id === "telegram");
				if (tgSkill) selectedSkills.push(tgSkill);
			}
		}
	}

	// ── Step 6: Working Directory ──
	let projectDir = os.homedir();

	if (!opts.yes) {
		const workChoice = await p.select({
			message: "Where should Claude work? 🐾",
			options: [
				{ value: "home", label: `Home directory ${dim("~")}`, hint: "recommended for general assistant" },
				{ value: "custom", label: "Pick a project directory", hint: "for project-focused work" },
			],
		});

		if (p.isCancel(workChoice)) {
			p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
			process.exit(0);
		}

		if (workChoice === "custom") {
			const customDir = await p.text({
				message: "Project directory path:",
				placeholder: "~/projects/my-app",
				validate: (v) => (v.length === 0 ? "Path cannot be empty" : undefined),
			});

			if (p.isCancel(customDir)) {
				p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
				process.exit(0);
			}

			projectDir = (customDir as string).replace(/^~/, os.homedir());
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

	// ── Step 7: Install Location ──
	let targetDir: string;
	if (opts.yes) {
		targetDir = getDefaultSkillsDir();
	} else {
		targetDir = await selectInstallLocation();
	}

	// ── Step 8: Confirmation ──
	const summary = buildSummary(selectedSkills, uniqueTools, missing, taps, interfaceMode, projectDir);
	p.note(summary, "Here's what we're fetching");

	if (!opts.yes) {
		const proceed = await p.confirm({
			message: "Ready to fetch all these goodies?",
			initialValue: true,
		});

		if (p.isCancel(proceed) || !proceed) {
			p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
			process.exit(0);
		}
	}

	// ── Step 9: Dry Run ──
	if (opts.dryRun) {
		p.log.info(dim("Dry run — no changes made. Just sniffing around."));
		p.outro(accent("openpaw dry run complete 🐾"));
		return;
	}

	// ── Step 10: Installation ──
	await pawStep("work", "Fetching your goodies...");

	const s = p.spinner();

	if (taps.size > 0) {
		s.start("🐾 Sniffing out Homebrew taps...");
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
			s.start(`🐾 [${i + 1}/${missing.length}] Teaching Claude a new trick: ${tool.name}...`);
			const result = installTool(tool);
			if (result.success) {
				s.stop(`${chalk.green("✓")} ${tool.name}`);
			} else {
				s.stop(`${chalk.red("✗")} ${tool.name} — ${result.error?.slice(0, 50)}`);
			}
		}
	} else if (uniqueTools.length > 0) {
		p.log.success("All tools already installed — clever pup!");
	}

	s.start("🐾 Burying treats in ~/.claude/skills/...");
	installSkill("core", targetDir);
	installSkill("memory", targetDir);
	const installed: string[] = ["c-core", "c-memory"];
	for (const skill of selectedSkills) {
		if (installSkill(skill.id, targetDir)) installed.push(`c-${skill.id}`);
	}
	s.stop(`🐾 ${installed.length} skills buried`);

	s.start("🐾 Setting up the doggy door...");
	const added = addPermissions(uniqueTools);
	s.stop(added.length > 0 ? `🐾 ${added.length} permission${added.length > 1 ? "s" : ""} added` : "🐾 Doggy door already open");

	s.start("🐾 Putting up the baby gate...");
	const hooksOk = installSafetyHooks();
	s.stop(hooksOk ? "🐾 Safety gate installed" : "🐾 Safety gate failed (non-critical)");

	// ── Step 10b: Telegram Config ──
	if (telegramConfig) {
		telegramConfig.workspaceDir = projectDir;
		telegramConfig.skills = selectedSkills.map((sk) => sk.id);
		writeTelegramConfig(telegramConfig);
		p.log.success("Telegram bridge configured");
	}

	// ── Step 10c: MCP Servers ──
	if (!opts.yes) {
		const wantMcp = await p.confirm({
			message: "Sniff out some MCP servers? (optional — search, memory, browser tools)",
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

					const needsEnv = chosen
						.map((id) => mcpServers.find((m) => m.id === id))
						.filter((srv): srv is McpServer => !!srv?.envPlaceholders);

					if (needsEnv.length > 0) {
						const envList = needsEnv
							.flatMap((srv) =>
								Object.entries(srv.envPlaceholders!).map(
									([key, _placeholder]) =>
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

	// ── Step 11: Auth Reminders ──
	const authSteps = selectedSkills
		.flatMap((skill) => skill.authSteps ?? [])
		.filter((step, i, arr) => arr.findIndex((s) => s.command === step.command) === i);

	if (authSteps.length > 0) {
		const authList = authSteps
			.map((st) => `${chalk.yellow("→")} ${chalk.bold(st.command)}  ${dim(st.description)}`)
			.join("\n");
		p.note(authList, "One-time auth needed");
	}

	// ── Step 12: Done + Launch ──
	await pawStep("done", "All done! *tail wag intensifies*");

	console.log("");
	console.log(dim("  Your pup is ready to play! Try saying:"));
	console.log(`  ${subtle('"What are my latest emails?"')}`);
	console.log(`  ${subtle('"Play some jazz on Spotify"')}`);
	console.log(`  ${subtle('"Go to hacker news and summarize the top posts"')}`);
	console.log("");

	if (opts.yes) {
		p.outro(accent("openpaw setup complete 🐾"));
		return;
	}

	// Offer to launch
	const launch = await p.confirm({
		message: "Time to go for a walk? (Launch your assistant)",
		initialValue: true,
	});

	if (p.isCancel(launch) || !launch) {
		if (interfaceMode === "telegram" || interfaceMode === "both") {
			p.log.info(`Start the Telegram bridge anytime with: ${bold("openpaw telegram")}`);
		}
		p.outro(accent("openpaw setup complete 🐾 — come back anytime!"));
		return;
	}

	// ── Dangerous Mode Disclaimer ──
	let useDangerousMode = false;
	if (interfaceMode === "native" || interfaceMode === "both") {
		showPuppyDisclaimer();

		const acceptDanger = await p.confirm({
			message: "Unleash full paw-er? *excited tail wag*",
			initialValue: true,
		});

		if (!p.isCancel(acceptDanger)) {
			useDangerousMode = acceptDanger as boolean;
		}
	}

	// ── tmux Option ──
	let useTmux = false;
	if (isTmuxAvailable() && !isInTmux()) {
		const tmuxDefault = interfaceMode === "both";
		const tmuxChoice = await p.confirm({
			message: "Run in tmux? (keeps going when you close the terminal)",
			initialValue: tmuxDefault,
		});

		if (!p.isCancel(tmuxChoice)) {
			useTmux = tmuxChoice as boolean;
		}
	}

	// ── Build launch commands ──
	const dangerFlag = useDangerousMode ? " --dangerously-skip-permissions" : "";
	const nativeCmd = `claude${dangerFlag}`;
	const telegramCmd = "npx openpaw telegram";

	// ── Launch ──
	if (useTmux) {
		p.outro(accent("Launching in tmux... 🐾"));
		launchInTmux({
			nativeCmd: interfaceMode === "native" || interfaceMode === "both" ? nativeCmd : undefined,
			telegramCmd: interfaceMode === "telegram" || interfaceMode === "both" ? telegramCmd : undefined,
			workDir: projectDir,
		});
	} else if (interfaceMode === "native") {
		p.outro(accent("Starting Claude Code... 🐾"));
		try {
			execSync(nativeCmd, { stdio: "inherit", cwd: projectDir });
		} catch {
			p.log.warn("Could not launch Claude Code. Make sure it's installed: https://claude.ai/code");
		}
	} else if (interfaceMode === "telegram") {
		p.outro(accent("Starting Telegram bridge... 🐾"));
		try {
			execSync(telegramCmd, { stdio: "inherit" });
		} catch {
			p.log.warn("Telegram bridge failed to start.");
		}
	} else {
		// Both without tmux: telegram in background, native in foreground
		p.log.info(dim("Starting Telegram bridge in background..."));
		launchInBackground(telegramCmd);
		p.outro(accent("Starting Claude Code... 🐾"));
		try {
			execSync(nativeCmd, { stdio: "inherit", cwd: projectDir });
		} catch {
			p.log.warn("Could not launch Claude Code. Make sure it's installed: https://claude.ai/code");
		}
	}
}

// ── Skill Selection ──

async function selectSkills(os: string): Promise<Skill[]> {
	const mode = await p.select({
		message: "How should we set things up, human?",
		options: [
			{ value: "preset", label: "⚡ Quick Setup", hint: "pick a treat... I mean, a preset" },
			{ value: "custom", label: "🎯 Custom", hint: "sniff through skills one by one" },
		],
	});

	if (p.isCancel(mode)) {
		p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
		process.exit(0);
	}

	if (mode === "preset") {
		return await selectFromPreset(os);
	}
	return await selectCustom(os);
}

async function selectFromPreset(os: string): Promise<Skill[]> {
	const presetChoice = await p.select({
		message: "Pick a treat... I mean, a preset!",
		options: presets.map((pr) => ({
			value: pr.id,
			label: pr.name,
			hint: pr.description,
		})),
	});

	if (p.isCancel(presetChoice)) {
		p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
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
			p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
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
		p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
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
			p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
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
	interfaceMode: InterfaceMode,
	projectDir: string,
): string {
	const lines: string[] = [];
	lines.push(`${bold("Skills:")}     ${selectedSkills.map((s) => s.name).join(", ")}`);
	lines.push(`${bold("Tools:")}      ${uniqueTools.length} total, ${missing.length} to install`);
	if (taps.size > 0) {
		lines.push(`${bold("Taps:")}       ${[...taps].join(", ")}`);
	}
	const modeLabel = interfaceMode === "native" ? "Terminal" : interfaceMode === "telegram" ? "Telegram" : "Terminal + Telegram";
	lines.push(`${bold("Interface:")}  ${modeLabel}`);
	lines.push(`${bold("Workspace:")}  ${projectDir.replace(os.homedir(), "~")}`);
	lines.push(`${bold("Memory:")}     ~/.claude/memory/`);
	lines.push(`${bold("Soul:")}       ~/.claude/SOUL.md`);
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
