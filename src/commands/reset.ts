import * as p from "@clack/prompts";
import chalk from "chalk";
import { skills } from "../catalog/index.js";
import { listInstalledSkills, removeSkill } from "../core/skills.js";
import { removePermissions } from "../core/permissions.js";
import { removeSafetyHooks } from "../core/hooks.js";
import { showMini } from "../core/branding.js";

export async function resetCommand(): Promise<void> {
	showMini();
	console.log("");

	const installed = listInstalledSkills();
	if (installed.length === 0) {
		p.log.info("Nothing to reset — no OpenPaw skills installed.");
		return;
	}

	const confirm = await p.confirm({
		message: `Remove all ${installed.length} OpenPaw skills and permissions?`,
	});

	if (p.isCancel(confirm) || !confirm) {
		p.cancel("Reset cancelled.");
		return;
	}

	const s = p.spinner();
	s.start("Removing skills and permissions...");

	// Remove all skills
	for (const skillId of installed) {
		const skill = skills.find((sk) => sk.id === skillId);
		if (skill) removePermissions(skill.tools);
		removeSkill(skillId);
	}

	// Remove safety hooks
	removeSafetyHooks();

	s.stop(`${chalk.green("✓")} Removed ${installed.length} skills, permissions, and hooks`);

	p.log.info(chalk.dim("CLI tools were not uninstalled (you may still want them)."));
	p.log.info(chalk.dim("To uninstall tools: brew uninstall <tool>"));
	p.outro("OpenPaw reset complete.");
}
