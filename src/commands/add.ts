import * as p from "@clack/prompts";
import chalk from "chalk";
import { getSkillById, getAllTaps } from "../catalog/index.js";
import { installTaps, installTool, getMissingTools } from "../core/installer.js";
import { installSkill, isSkillInstalled } from "../core/skills.js";
import { addPermissions } from "../core/permissions.js";
import { showMini } from "../core/branding.js";
import { regenerateClaudeMd } from "../core/claude-md.js";

export async function addCommand(skillIds: string[]): Promise<void> {
	showMini();
	console.log("");

	if (skillIds.length === 0) {
		p.log.error("Specify skills to add: openpaw add notes music email");
		return;
	}

	const s = p.spinner();

	for (const id of skillIds) {
		const skill = getSkillById(id);
		if (!skill) {
			p.log.error(`Unknown skill: ${id}`);
			continue;
		}

		if (isSkillInstalled(id)) {
			p.log.info(`c-${id} already installed, skipping`);
			continue;
		}

		// Install taps
		const taps = getAllTaps([skill]);
		if (taps.size > 0) installTaps(taps);

		// Install tools
		const missing = getMissingTools(skill.tools);
		for (const tool of missing) {
			s.start(`Installing ${tool.name}...`);
			const result = installTool(tool);
			s.stop(
				result.success
					? `${chalk.green("✓")} ${tool.name}`
					: `${chalk.red("✗")} ${tool.name}: ${result.error?.slice(0, 50)}`,
			);
		}

		// Create skill
		installSkill(id);
		addPermissions(skill.tools);
		p.log.success(`c-${id} installed`);

		// Auth reminders
		if (skill.authSteps?.length) {
			for (const step of skill.authSteps) {
				console.log(`  ${chalk.yellow("→")} ${step.command} — ${step.description}`);
			}
		}
	}

	// Update CLAUDE.md so Claude knows about new skills
	regenerateClaudeMd();
}
