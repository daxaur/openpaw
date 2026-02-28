import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { CliTool, SettingsJson } from "../types.js";

const SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");

export function getSettingsPath(): string {
	return SETTINGS_PATH;
}

export function readSettings(): SettingsJson {
	try {
		if (!fs.existsSync(SETTINGS_PATH)) return {};
		const content = fs.readFileSync(SETTINGS_PATH, "utf8");
		return JSON.parse(content);
	} catch {
		return {};
	}
}

export function writeSettings(settings: SettingsJson): void {
	const dir = path.dirname(SETTINGS_PATH);
	fs.mkdirSync(dir, { recursive: true });

	// Atomic write: write to temp file then rename
	const tmpPath = `${SETTINGS_PATH}.tmp`;
	fs.writeFileSync(tmpPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
	fs.renameSync(tmpPath, SETTINGS_PATH);
}

export function getPermissionRule(tool: CliTool): string {
	return `Bash(${tool.command} *)`;
}

export function addPermissions(tools: CliTool[]): string[] {
	const settings = readSettings();
	if (!settings.permissions) settings.permissions = {};
	if (!Array.isArray(settings.permissions.allow)) settings.permissions.allow = [];

	const existing = new Set(settings.permissions.allow);
	const added: string[] = [];

	for (const tool of tools) {
		const rule = getPermissionRule(tool);
		if (!existing.has(rule)) {
			settings.permissions.allow.push(rule);
			existing.add(rule);
			added.push(rule);
		}
	}

	if (added.length > 0) {
		writeSettings(settings);
	}

	return added;
}

export function removePermissions(tools: CliTool[]): string[] {
	const settings = readSettings();
	if (!settings.permissions?.allow) return [];

	const toRemove = new Set(tools.map(getPermissionRule));
	const before = settings.permissions.allow.length;

	settings.permissions.allow = settings.permissions.allow.filter(
		(rule: string) => !toRemove.has(rule),
	);

	const removed = before - settings.permissions.allow.length;
	if (removed > 0) {
		writeSettings(settings);
	}

	return tools.map(getPermissionRule).filter((r) => toRemove.has(r));
}

export function listPermissions(): string[] {
	const settings = readSettings();
	return (settings.permissions?.allow ?? []).filter((r: string) => r.startsWith("Bash("));
}
