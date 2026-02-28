import chalk from "chalk";
import { skills, categoryLabels, getSkillsForPlatform } from "../catalog/index.js";
import { detectPlatform } from "../core/platform.js";
import { showMini } from "../core/branding.js";
import { listInstalledSkills } from "../core/skills.js";

export async function listCommand(): Promise<void> {
	showMini();
	console.log("");

	const platform = detectPlatform();
	const available = getSkillsForPlatform(platform.os);
	const installed = new Set(listInstalledSkills());
	const total = skills.length;

	console.log(
		chalk.bold(`  ${available.length} skills available`) +
			chalk.dim(` (${total} total, ${total - available.length} not on ${platform.osName})`),
	);
	console.log("");

	// Group by category
	const grouped = new Map<string, typeof available>();
	for (const skill of available) {
		const existing = grouped.get(skill.category) ?? [];
		existing.push(skill);
		grouped.set(skill.category, existing);
	}

	for (const [category, categorySkills] of grouped) {
		const label = categoryLabels[category] ?? category;
		console.log(`  ${chalk.hex("#a855f7").bold(label)}`);

		for (const skill of categorySkills) {
			const isInstalled = installed.has(skill.id);
			const icon = isInstalled ? chalk.green("●") : chalk.dim("○");
			const name = isInstalled ? chalk.bold(`c-${skill.id}`) : chalk.white(`c-${skill.id}`);
			const tools = skill.tools.length > 0
				? chalk.dim(` [${skill.tools.map((t) => t.command).join(", ")}]`)
				: skill.subChoices
					? chalk.dim(` [${skill.subChoices.options.map((o) => o.label).join(" / ")}]`)
					: "";
			const badge = isInstalled ? chalk.green(" installed") : "";
			console.log(`    ${icon} ${name} — ${skill.description}${tools}${badge}`);
		}
		console.log("");
	}

	console.log(chalk.dim(`  Run ${chalk.white("openpaw setup")} to install skills`));
	console.log("");
}
