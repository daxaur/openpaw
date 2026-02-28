import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as p from "@clack/prompts";
import { showMini, accent, dim } from "../core/branding.js";
import { listInstalledSkills, getDefaultSkillsDir } from "../core/skills.js";
import { readSettings } from "../core/permissions.js";

interface ExportBundle {
	version: string;
	exportedAt: string;
	skills: string[];
	permissions: string[];
	soul: string | null;
	memory: Record<string, string>;
}

export async function exportCommand(): Promise<void> {
	showMini();
	p.intro(accent(" openpaw export "));

	const claudeDir = path.join(os.homedir(), ".claude");
	const bundle: ExportBundle = {
		version: "1",
		exportedAt: new Date().toISOString(),
		skills: [],
		permissions: [],
		soul: null,
		memory: {},
	};

	// Collect installed skills
	const installed = listInstalledSkills();
	bundle.skills = installed;
	p.log.info(`${installed.length} skills found`);

	// Collect permissions
	const settings = readSettings();
	bundle.permissions = (settings.permissions?.allow as string[]) ?? [];

	// Collect SOUL.md
	const soulPath = path.join(claudeDir, "SOUL.md");
	if (fs.existsSync(soulPath)) {
		bundle.soul = fs.readFileSync(soulPath, "utf-8");
		p.log.info("SOUL.md included");
	}

	// Collect memory files
	const memoryDir = path.join(claudeDir, "memory");
	if (fs.existsSync(memoryDir)) {
		const files = fs.readdirSync(memoryDir).filter((f) => f.endsWith(".md"));
		for (const file of files) {
			bundle.memory[file] = fs.readFileSync(path.join(memoryDir, file), "utf-8");
		}
		p.log.info(`${files.length} memory files included`);
	}

	// Write export file
	const outputPath = path.resolve("openpaw-export.json");
	fs.writeFileSync(outputPath, JSON.stringify(bundle, null, 2), "utf-8");

	p.log.success(`Exported to ${dim(outputPath)}`);
	p.outro(accent("Import on another machine: openpaw import openpaw-export.json"));
}

export async function importCommand(file: string): Promise<void> {
	showMini();
	p.intro(accent(" openpaw import "));

	const filePath = path.resolve(file);
	if (!fs.existsSync(filePath)) {
		p.log.error(`File not found: ${filePath}`);
		process.exit(1);
	}

	let bundle: ExportBundle;
	try {
		bundle = JSON.parse(fs.readFileSync(filePath, "utf-8"));
	} catch {
		p.log.error("Invalid export file — must be valid JSON");
		process.exit(1);
	}

	p.log.info(`Export from ${dim(bundle.exportedAt)}`);
	p.log.info(`${bundle.skills.length} skills, ${Object.keys(bundle.memory).length} memory files`);

	const proceed = await p.confirm({
		message: "Import this configuration?",
		initialValue: true,
	});

	if (p.isCancel(proceed) || !proceed) {
		p.cancel("Import cancelled.");
		return;
	}

	const claudeDir = path.join(os.homedir(), ".claude");
	const s = p.spinner();

	// Restore SOUL.md
	if (bundle.soul) {
		s.start("🐾 Restoring SOUL.md...");
		fs.mkdirSync(claudeDir, { recursive: true });
		fs.writeFileSync(path.join(claudeDir, "SOUL.md"), bundle.soul, "utf-8");
		s.stop("🐾 SOUL.md restored");
	}

	// Restore memory
	if (Object.keys(bundle.memory).length > 0) {
		s.start("🐾 Restoring memory...");
		const memoryDir = path.join(claudeDir, "memory");
		fs.mkdirSync(memoryDir, { recursive: true });
		for (const [file, content] of Object.entries(bundle.memory)) {
			fs.writeFileSync(path.join(memoryDir, file), content, "utf-8");
		}
		s.stop(`🐾 ${Object.keys(bundle.memory).length} memory files restored`);
	}

	// Reinstall skills
	if (bundle.skills.length > 0) {
		const { installSkill } = await import("../core/skills.js");
		s.start("🐾 Reinstalling skills...");
		const targetDir = getDefaultSkillsDir();
		let count = 0;
		for (const skillId of bundle.skills) {
			const id = skillId.replace(/^c-/, "");
			if (installSkill(id, targetDir)) count++;
		}
		s.stop(`🐾 ${count} skills installed`);
	}

	// Restore permissions
	if (bundle.permissions.length > 0) {
		s.start("🐾 Restoring permissions...");
		const settings = readSettings();
		const existing = new Set((settings.permissions?.allow as string[]) ?? []);
		const newPerms = bundle.permissions.filter((p) => !existing.has(p));
		if (newPerms.length > 0) {
			if (!settings.permissions) settings.permissions = {};
			settings.permissions.allow = [...existing, ...newPerms];
			const { writeSettings } = await import("../core/permissions.js");
			writeSettings(settings);
		}
		s.stop(`🐾 ${newPerms.length} permissions added`);
	}

	p.log.success("Import complete");
	p.outro(accent("Run openpaw status to verify 🐾"));
}
