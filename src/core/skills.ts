import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getDefaultSkillsDir(): string {
	return path.join(os.homedir(), ".claude", "skills");
}

export function getSkillTemplatePath(skillId: string): string {
	// In production (dist/), skills/ is at package root (two levels up from dist/index.js)
	// In dev, we resolve from src/core/ up to project root
	const candidates = [
		path.resolve(__dirname, "..", "..", "skills", `c-${skillId}`, "SKILL.md"),
		path.resolve(__dirname, "..", "skills", `c-${skillId}`, "SKILL.md"),
		path.resolve(__dirname, "skills", `c-${skillId}`, "SKILL.md"),
	];

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) return candidate;
	}

	return candidates[0];
}

export function getInstalledSkillPath(skillId: string, skillsDir?: string): string {
	const dir = skillsDir ?? getDefaultSkillsDir();
	return path.join(dir, `c-${skillId}`, "SKILL.md");
}

export function isSkillInstalled(skillId: string, skillsDir?: string): boolean {
	return fs.existsSync(getInstalledSkillPath(skillId, skillsDir));
}

export function installSkill(skillId: string, skillsDir?: string): boolean {
	const templatePath = getSkillTemplatePath(skillId);
	const targetPath = getInstalledSkillPath(skillId, skillsDir);

	if (!fs.existsSync(templatePath)) {
		return false;
	}

	const targetDir = path.dirname(targetPath);
	fs.mkdirSync(targetDir, { recursive: true });
	fs.copyFileSync(templatePath, targetPath);
	return true;
}

export function removeSkill(skillId: string, skillsDir?: string): boolean {
	const dir = skillsDir ?? getDefaultSkillsDir();
	const skillDir = path.join(dir, `c-${skillId}`);

	if (!fs.existsSync(skillDir)) return false;

	fs.rmSync(skillDir, { recursive: true, force: true });
	return true;
}

export function listInstalledSkills(skillsDir?: string): string[] {
	const dir = skillsDir ?? getDefaultSkillsDir();
	if (!fs.existsSync(dir)) return [];

	return fs
		.readdirSync(dir)
		.filter((name) => name.startsWith("c-") && fs.existsSync(path.join(dir, name, "SKILL.md")))
		.map((name) => name.replace("c-", ""));
}
