import { execSync } from "node:child_process";
import type { CliTool } from "../types.js";
import { isToolInstalled } from "./platform.js";

export interface InstallResult {
	tool: string;
	success: boolean;
	alreadyInstalled: boolean;
	error?: string;
}

export function checkToolStatus(tools: CliTool[]): Map<string, boolean> {
	const status = new Map<string, boolean>();
	for (const tool of tools) {
		status.set(tool.name, isToolInstalled(tool.command));
	}
	return status;
}

export function getMissingTools(tools: CliTool[]): CliTool[] {
	return tools.filter((t) => !isToolInstalled(t.command));
}

export function installTap(tap: string): boolean {
	try {
		execSync(`brew tap ${tap}`, {
			stdio: "pipe",
			timeout: 60000,
		});
		return true;
	} catch {
		return false;
	}
}

export function installTool(tool: CliTool): InstallResult {
	if (isToolInstalled(tool.command)) {
		return { tool: tool.name, success: true, alreadyInstalled: true };
	}

	try {
		execSync(tool.installCmd, {
			stdio: "pipe",
			timeout: 120000,
		});
		return { tool: tool.name, success: true, alreadyInstalled: false };
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return { tool: tool.name, success: false, alreadyInstalled: false, error: message };
	}
}

export function installTools(
	tools: CliTool[],
	onProgress?: (tool: string, index: number, total: number) => void,
): InstallResult[] {
	const missing = getMissingTools(tools);
	const results: InstallResult[] = [];

	// Mark already-installed tools
	for (const tool of tools) {
		if (isToolInstalled(tool.command)) {
			results.push({ tool: tool.name, success: true, alreadyInstalled: true });
		}
	}

	// Install missing tools
	for (let i = 0; i < missing.length; i++) {
		onProgress?.(missing[i].name, i, missing.length);
		results.push(installTool(missing[i]));
	}

	return results;
}

export function installTaps(taps: Set<string>): Map<string, boolean> {
	const results = new Map<string, boolean>();
	for (const tap of taps) {
		results.set(tap, installTap(tap));
	}
	return results;
}
