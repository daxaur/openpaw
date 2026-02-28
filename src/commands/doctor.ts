import * as p from "@clack/prompts";
import chalk from "chalk";
import { skills } from "../catalog/index.js";
import { listInstalledSkills } from "../core/skills.js";
import { isToolInstalled } from "../core/platform.js";
import { readSettings } from "../core/permissions.js";
import { showMini } from "../core/branding.js";
import { detectPlatform } from "../core/platform.js";

export async function doctorCommand(): Promise<void> {
	showMini();
	console.log("");
	p.log.info("Running diagnostics...\n");

	let issues = 0;

	// Check platform
	const platform = detectPlatform();
	console.log(`  ${chalk.green("✓")} Platform: ${platform.osName} ${platform.osVersion}`);

	if (platform.hasBrew) {
		console.log(`  ${chalk.green("✓")} Homebrew installed`);
	} else {
		console.log(`  ${chalk.red("✗")} Homebrew not found — most tools need it`);
		issues++;
	}

	// Check Claude Code skills dir
	const installed = listInstalledSkills();
	if (installed.length > 0) {
		console.log(`  ${chalk.green("✓")} ${installed.length} skills installed`);
	} else {
		console.log(`  ${chalk.red("✗")} No skills installed — run: openpaw setup`);
		issues++;
	}

	// Check core coordinator
	if (installed.includes("core")) {
		console.log(`  ${chalk.green("✓")} Core coordinator (c-core) present`);
	} else if (installed.length > 0) {
		console.log(`  ${chalk.yellow("!")} Core coordinator missing — run: openpaw add core`);
		issues++;
	}

	// Check tools for each installed skill
	for (const skillId of installed) {
		if (skillId === "core") continue;
		const skill = skills.find((s) => s.id === skillId);
		if (!skill) continue;

		for (const tool of skill.tools) {
			if (isToolInstalled(tool.command)) {
				console.log(`  ${chalk.green("✓")} ${tool.name} installed (c-${skillId})`);
			} else {
				console.log(`  ${chalk.red("✗")} ${tool.name} missing — needed by c-${skillId}`);
				issues++;
			}
		}
	}

	// Check permissions
	const settings = readSettings();
	const perms = settings.permissions?.allow ?? [];
	const bashPerms = perms.filter((r: string) => r.startsWith("Bash("));
	if (bashPerms.length > 0) {
		console.log(`  ${chalk.green("✓")} ${bashPerms.length} Bash permissions configured`);
	} else if (installed.length > 0) {
		console.log(`  ${chalk.red("✗")} No Bash permissions in settings.json`);
		issues++;
	}

	// Summary
	console.log("");
	if (issues === 0) {
		p.log.success("All checks passed!");
	} else {
		p.log.warn(`${issues} issue${issues > 1 ? "s" : ""} found`);
	}
}
