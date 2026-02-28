import * as p from "@clack/prompts";
import chalk from "chalk";
import { getSkillById } from "../catalog/index.js";
import { removeSkill, isSkillInstalled } from "../core/skills.js";
import { removePermissions } from "../core/permissions.js";
import { showMini } from "../core/branding.js";

export async function removeCommand(skillIds: string[]): Promise<void> {
	showMini();
	console.log("");

	if (skillIds.length === 0) {
		p.log.error("Specify skills to remove: openpaw remove notes music");
		return;
	}

	for (const id of skillIds) {
		if (id === "core") {
			p.log.warn("Cannot remove c-core (coordinator). Use 'openpaw reset' instead.");
			continue;
		}

		if (!isSkillInstalled(id)) {
			p.log.info(`c-${id} is not installed`);
			continue;
		}

		const skill = getSkillById(id);
		removeSkill(id);

		if (skill) {
			removePermissions(skill.tools);
		}

		p.log.success(`${chalk.bold(`c-${id}`)} removed`);
	}
}
