import { execSync } from "node:child_process";
import os from "node:os";
import type { Platform, PlatformInfo } from "../types.js";

function commandExists(cmd: string): boolean {
	try {
		execSync(`command -v ${cmd}`, { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function getOsVersion(): string {
	try {
		if (process.platform === "darwin") {
			return execSync("sw_vers -productVersion", { encoding: "utf8" }).trim();
		}
		return os.release();
	} catch {
		return os.release();
	}
}

function getOsName(): string {
	switch (process.platform) {
		case "darwin":
			return "macOS";
		case "linux":
			return "Linux";
		case "win32":
			return "Windows";
		default:
			return process.platform;
	}
}

export function detectPlatform(): PlatformInfo {
	return {
		os: process.platform as Platform,
		osName: getOsName(),
		osVersion: getOsVersion(),
		hasBrew: commandExists("brew"),
		hasNpm: commandExists("npm"),
		hasPip: commandExists("pip3") || commandExists("pip"),
	};
}

export function getToolVersion(command: string): string | null {
	try {
		const result = execSync(`${command} --version 2>/dev/null || ${command} -v 2>/dev/null || ${command} version 2>/dev/null`, {
			encoding: "utf8",
			timeout: 5000,
		}).trim();
		const match = result.match(/\d+\.\d+[\.\d]*/);
		return match ? match[0] : result.split("\n")[0].slice(0, 30);
	} catch {
		return null;
	}
}

export function isToolInstalled(command: string): boolean {
	return commandExists(command);
}
