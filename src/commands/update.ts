import { execSync } from "node:child_process";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { skills } from "../catalog/index.js";
import { listInstalledSkills } from "../core/skills.js";
import { isToolInstalled } from "../core/platform.js";
import { showMini } from "../core/branding.js";

export async function updateCommand(): Promise<void> {
	showMini();
	console.log("");

	const installed = listInstalledSkills();
	if (installed.length === 0) {
		p.log.warn("No skills installed. Run: openpaw setup");
		return;
	}

	const s = p.spinner();

	// Collect all installed tools that use brew
	const brewTools: string[] = [];
	for (const skillId of installed) {
		const skill = skills.find((sk) => sk.id === skillId);
		if (!skill) continue;
		for (const tool of skill.tools) {
			if (
				(tool.installMethod === "brew" || tool.installMethod === "brew-tap") &&
				isToolInstalled(tool.command)
			) {
				brewTools.push(tool.name);
			}
		}
	}

	if (brewTools.length === 0) {
		p.log.info("No Homebrew-installed tools to update");
		return;
	}

	s.start(`Updating ${brewTools.length} tools via Homebrew...`);
	try {
		execSync("brew update", { stdio: "pipe", timeout: 60000 });
		execSync(`brew upgrade ${brewTools.join(" ")} 2>/dev/null || true`, {
			stdio: "pipe",
			timeout: 120000,
		});
		s.stop(`${chalk.green("✓")} ${brewTools.length} tools updated`);
	} catch {
		s.stop(`${chalk.yellow("!")} Update completed with some warnings`);
	}
}
