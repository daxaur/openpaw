import * as p from "@clack/prompts";
import chalk from "chalk";
import { skills, categoryLabels, getSkillsByCategory, getAllTaps } from "../catalog/index.js";
import { detectPlatform } from "../core/platform.js";
import { showBanner, pawStep, pawPulse, accent, subtle, dim } from "../core/branding.js";
import { installTaps, getMissingTools, installTool } from "../core/installer.js";
import { installSkill, getDefaultSkillsDir } from "../core/skills.js";
import { addPermissions } from "../core/permissions.js";
import { installSafetyHooks } from "../core/hooks.js";
import type { CliTool, Skill } from "../types.js";

export async function setupCommand(): Promise<void> {
	await showBanner();

	const platform = detectPlatform();
	p.intro(accent(" openpaw "));

	// ── Platform ──
	const brewStatus = platform.hasBrew ? chalk.green("✓ brew") : chalk.red("✗ brew");
	p.log.info(`${chalk.bold(platform.osName)} ${platform.osVersion}  ${brewStatus}`);

	if (!platform.hasBrew && platform.os === "darwin") {
		p.log.warn("Homebrew is required for most tools → https://brew.sh");
	}

	// ── Step 1: Skill Selection ──
	await pawStep("wave", "What should Claude be able to do?");

	const grouped = getSkillsByCategory(platform.os);
	const groupedOptions: Record<string, { value: string; label: string; hint?: string }[]> = {};

	for (const [category, categorySkills] of grouped) {
		const label = categoryLabels[category] ?? category;
		groupedOptions[label] = categorySkills.map((skill) => ({
			value: skill.id,
			label: skill.name,
			hint: skill.description,
		}));
	}

	const selected = await p.groupMultiselect({
		message: "Pick your skills",
		options: groupedOptions,
		required: false,
	});

	if (p.isCancel(selected)) {
		p.cancel("Setup cancelled.");
		process.exit(0);
	}

	const selectedIds = (selected as string[]).filter((id) => {
		return skills.some((s) => s.id === id);
	});

	if (selectedIds.length === 0) {
		p.log.warn("No skills selected. Run openpaw again when ready.");
		p.outro("See you later!");
		return;
	}

	const selectedSkills = selectedIds
		.map((id) => skills.find((s) => s.id === id))
		.filter((s): s is Skill => s !== undefined);

	await pawStep("happy", `${selectedSkills.length} skill${selectedSkills.length > 1 ? "s" : ""} selected!`);

	// ── Step 2: Sub-Choices ──
	const skillsWithChoices = selectedSkills.filter((s) => s.subChoices);
	if (skillsWithChoices.length > 0) {
		await pawStep("think", "A few more choices...");
	}

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

	// ── Step 3: Install Location ──
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

	// ── Collect tools ──
	const allTools: CliTool[] = [];
	for (const skill of selectedSkills) {
		allTools.push(...skill.tools);
	}
	const uniqueTools = [...new Map(allTools.map((t) => [t.command, t])).values()];
	const taps = getAllTaps(selectedSkills);

	// ── Step 4: Installation ──
	await pawStep("work", "Installing everything...");

	const s = p.spinner();

	if (taps.size > 0) {
		s.start("Adding Homebrew taps");
		const tapResults = installTaps(taps);
		const failed = [...tapResults].filter(([, ok]) => !ok);
		if (failed.length > 0) {
			s.stop(`Taps: ${taps.size - failed.length} added, ${failed.length} failed`);
		} else {
			s.stop(`${taps.size} tap${taps.size > 1 ? "s" : ""} ready`);
		}
	}

	const missing = getMissingTools(uniqueTools);
	if (missing.length > 0) {
		for (let i = 0; i < missing.length; i++) {
			const tool = missing[i];
			s.start(`[${i + 1}/${missing.length}] Installing ${tool.name}`);
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

	s.start("Creating skills");
	installSkill("core", targetDir);
	const installed: string[] = ["c-core"];
	for (const skill of selectedSkills) {
		if (installSkill(skill.id, targetDir)) installed.push(`c-${skill.id}`);
	}
	s.stop(`${installed.length} skills created`);

	s.start("Configuring permissions");
	const added = addPermissions(uniqueTools);
	s.stop(added.length > 0 ? `${added.length} permission${added.length > 1 ? "s" : ""} added` : "Permissions up to date");

	s.start("Installing safety hooks");
	const hooksOk = installSafetyHooks();
	s.stop(hooksOk ? "Safety hooks active" : "Safety hooks failed (non-critical)");

	// ── Auth Reminders ──
	const authSteps = selectedSkills
		.flatMap((skill) => skill.authSteps ?? [])
		.filter((step, i, arr) => arr.findIndex((s) => s.command === step.command) === i);

	if (authSteps.length > 0) {
		await pawStep("warn", "Some tools need one-time auth");
		const authList = authSteps
			.map((st) => `${chalk.yellow("→")} ${chalk.bold(st.command)}  ${dim(st.description)}`)
			.join("\n");
		p.note(authList, "Auth steps");
	}

	// ── Done ──
	await pawStep("done", "Setup complete!");

	console.log("");
	console.log(dim("  Open Claude Code and try:"));
	console.log(`  ${subtle('"What are my latest emails?"')}`);
	console.log(`  ${subtle('"Play some jazz on Spotify"')}`);
	console.log(`  ${subtle('"Go to hacker news and summarize the top posts"')}`);
	console.log("");

	p.outro(accent("openpaw setup complete"));
}
