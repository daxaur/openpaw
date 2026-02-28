import * as p from "@clack/prompts";
import chalk from "chalk";
import { skills } from "../catalog/index.js";
import { listInstalledSkills } from "../core/skills.js";
import { isToolInstalled, getToolVersion } from "../core/platform.js";
import { showMini } from "../core/branding.js";

export async function statusCommand(): Promise<void> {
	showMini();
	console.log("");

	const installed = listInstalledSkills();

	if (installed.length === 0) {
		p.log.warn("No OpenPaw skills installed. Run: openpaw setup");
		return;
	}

	p.log.info(`${chalk.bold(installed.length)} skills installed:\n`);

	for (const skillId of installed) {
		if (skillId === "core") {
			console.log(`  ${chalk.green("●")} ${chalk.bold("c-core")} ${chalk.dim("— coordinator")}`);
			continue;
		}

		const skill = skills.find((s) => s.id === skillId);
		if (!skill) {
			console.log(`  ${chalk.yellow("●")} c-${skillId} ${chalk.dim("— unknown skill")}`);
			continue;
		}

		const toolStatus = skill.tools.map((t) => {
			const ok = isToolInstalled(t.command);
			const version = ok ? getToolVersion(t.command) : null;
			return ok
				? `${chalk.green(t.command)}${version ? chalk.dim(` v${version}`) : ""}`
				: chalk.red(t.command);
		});

		const allOk = skill.tools.every((t) => isToolInstalled(t.command));
		const icon = allOk ? chalk.green("●") : chalk.red("●");

		console.log(`  ${icon} ${chalk.bold(`c-${skill.id}`)} — ${skill.name} [${toolStatus.join(", ")}]`);
	}
	console.log("");
}
