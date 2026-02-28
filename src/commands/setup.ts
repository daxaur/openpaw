import * as p from "@clack/prompts";
import chalk from "chalk";
import { skills, categoryLabels, getSkillsByCategory, getAllTaps } from "../catalog/index.js";
import { detectPlatform } from "../core/platform.js";
import { showBanner, pawPulse, accent, dim } from "../core/branding.js";
import { installTaps, getMissingTools, installTool } from "../core/installer.js";
import { installSkill, getDefaultSkillsDir } from "../core/skills.js";
import { addPermissions } from "../core/permissions.js";
import { installSafetyHooks } from "../core/hooks.js";
import type { CliTool, Skill } from "../types.js";

export async function setupCommand(): Promise<void> {
	await showBanner();

	const platform = detectPlatform();
	p.intro(accent(" openpaw setup "));

	p.log.info(
		`${chalk.bold(platform.osName)} ${platform.osVersion} detected` +
		(platform.hasBrew ? chalk.green(" — brew found") : chalk.red(" — brew not found")),
	);

	if (!platform.hasBrew && platform.os === "darwin") {
		p.log.warn("Homebrew is required for most tools. Install it: https://brew.sh");
	}

	// ── Skill Selection ──
	await pawPulse("wave", "What do you want Claude to do?");

	const grouped = getSkillsByCategory(platform.os);
	const options: { value: string; label: string; hint?: string }[] = [];

	for (const [category, categorySkills] of grouped) {
		const label = categoryLabels[category] ?? category;
		for (const skill of categorySkills) {
			options.push({
				value: skill.id,
				label: `${skill.name}`,
				hint: `${dim(label)} — ${skill.description}`,
			});
		}
	}

	const selected = await p.multiselect({
		message: "Pick your skills",
		options,
		required: false,
	});

	if (p.isCancel(selected)) {
		p.cancel("Setup cancelled.");
		process.exit(0);
	}

	const selectedIds = selected as string[];
	if (selectedIds.length === 0) {
		p.log.warn("No skills selected. Run openpaw again when you're ready.");
		p.outro("See you later!");
		return;
	}

	const selectedSkills = selectedIds
		.map((id) => skills.find((s) => s.id === id))
		.filter((s): s is Skill => s !== undefined);

	await pawPulse("happy", `${selectedSkills.length} skills selected!`);

	// ── Sub-Choices ──
	for (const skill of selectedSkills) {
		if (skill.subChoices) {
			await pawPulse("think", `Configuring ${skill.name}...`);

			const choice = await p.select({
				message: skill.subChoices.question,
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

	// ── Skills Directory ──
	const skillsDir = await p.select({
		message: "Where should skills be installed?",
		options: [
			{ value: getDefaultSkillsDir(), label: `~/.claude/skills/ ${dim("(recommended — global)")}` },
			{ value: ".claude/skills", label: `.claude/skills/ ${dim("(project-local)")}` },
			{ value: "custom", label: "Custom path..." },
		],
	});

	if (p.isCancel(skillsDir)) {
		p.cancel("Setup cancelled.");
		process.exit(0);
	}

	let targetDir = skillsDir as string;
	if (targetDir === "custom") {
		const customDir = await p.text({
			message: "Enter skills directory path:",
			placeholder: "~/.claude/skills",
			validate: (v) => (v.length === 0 ? "Path cannot be empty" : undefined),
		});
		if (p.isCancel(customDir)) {
			p.cancel("Setup cancelled.");
			process.exit(0);
		}
		targetDir = customDir as string;
	}

	// ── Collect all tools ──
	const allTools: CliTool[] = [];
	for (const skill of selectedSkills) {
		allTools.push(...skill.tools);
	}
	const uniqueTools = [...new Map(allTools.map((t) => [t.command, t])).values()];
	const taps = getAllTaps(selectedSkills);

	// ── Installation ──
	await pawPulse("work", "Installing everything...");

	const s = p.spinner();

	// Install brew taps
	if (taps.size > 0) {
		s.start("Adding Homebrew taps...");
		const tapResults = installTaps(taps);
		const failed = [...tapResults].filter(([, ok]) => !ok);
		if (failed.length > 0) {
			s.stop(`Taps added (${failed.length} failed: ${failed.map(([t]) => t).join(", ")})`);
		} else {
			s.stop(`${taps.size} Homebrew tap${taps.size > 1 ? "s" : ""} ready`);
		}
	}

	// Install CLI tools
	const missing = getMissingTools(uniqueTools);
	if (missing.length > 0) {
		for (let i = 0; i < missing.length; i++) {
			const tool = missing[i];
			s.start(`Installing ${tool.name} [${i + 1}/${missing.length}]...`);
			const result = installTool(tool);
			if (result.success) {
				s.stop(`${chalk.green("✓")} ${tool.name} installed`);
			} else {
				s.stop(`${chalk.red("✗")} ${tool.name} failed: ${result.error?.slice(0, 60)}`);
			}
		}
	} else {
		p.log.success("All CLI tools already installed");
	}

	// Create skill files
	s.start("Creating Claude Code skills...");
	installSkill("core", targetDir);
	const skillResults: string[] = ["c-core"];
	for (const skill of selectedSkills) {
		const ok = installSkill(skill.id, targetDir);
		if (ok) skillResults.push(`c-${skill.id}`);
	}
	s.stop(`${skillResults.length} skills created`);

	// Configure permissions
	s.start("Configuring permissions...");
	const added = addPermissions(uniqueTools);
	s.stop(
		added.length > 0
			? `${added.length} permission${added.length > 1 ? "s" : ""} added to settings.json`
			: "Permissions already configured",
	);

	// Install safety hooks
	s.start("Installing safety hooks...");
	const hooksOk = installSafetyHooks();
	s.stop(hooksOk ? "Safety hooks installed" : "Safety hooks failed (non-critical)");

	// ── Auth Reminders ──
	const authSteps = selectedSkills
		.flatMap((skill) => skill.authSteps ?? [])
		.filter((step, i, arr) => arr.findIndex((s) => s.command === step.command) === i);

	if (authSteps.length > 0) {
		await pawPulse("warn", "Some tools need one-time auth:");
		for (const step of authSteps) {
			console.log(`  ${chalk.yellow("→")} ${chalk.bold(step.command)}  ${dim(step.description)}`);
		}
		console.log("");
	}

	// ── Done ──
	await pawPulse("done", "OpenPaw setup complete!");
	console.log("");
	console.log(dim("  Open Claude Code and try:"));
	console.log(`  ${accent('"What are my latest emails?"')}`);
	console.log(`  ${accent('"Add milk to my reminders"')}`);
	console.log(`  ${accent('"Play some jazz on Spotify"')}`);
	console.log("");

	p.outro(`Run ${chalk.bold("openpaw status")} to see what's installed`);
}
