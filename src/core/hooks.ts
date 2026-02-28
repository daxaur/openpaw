import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { readSettings, writeSettings } from "./permissions.js";

const HOOKS_DIR = path.join(os.homedir(), ".claude", "openpaw-hooks");

const SAFETY_SCRIPT = `#!/bin/bash
# OpenPaw safety hook — blocks dangerous patterns
# Installed by: npx openpaw

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | head -1 | sed 's/"command":"//;s/"//')

# Block mass email sends
if echo "$COMMAND" | grep -qE '(gog mail send|himalaya send).*--to.*,.*,.*,.*,'; then
  echo "Blocked: Mass email send detected. Use individual sends." >&2
  exit 2
fi

# Block mass deletes
if echo "$COMMAND" | grep -qE '(rm -rf|--delete-all|--purge|--wipe)'; then
  echo "Blocked: Destructive bulk operation detected." >&2
  exit 2
fi

exit 0
`;

export function installSafetyHooks(): boolean {
	try {
		// Create hooks directory
		fs.mkdirSync(HOOKS_DIR, { recursive: true });

		// Write safety script
		const scriptPath = path.join(HOOKS_DIR, "safety-check.sh");
		fs.writeFileSync(scriptPath, SAFETY_SCRIPT, { mode: 0o755 });

		// Add hook to settings.json
		const settings = readSettings();
		if (!settings.hooks) settings.hooks = {};

		const preToolUse = (settings.hooks as Record<string, unknown[]>).PreToolUse ?? [];

		// Check if our hook already exists
		const hasOurHook = Array.isArray(preToolUse) && preToolUse.some(
			(h: unknown) => {
				if (typeof h === "object" && h !== null && "hooks" in h) {
					const hooks = (h as { hooks: unknown[] }).hooks;
					return Array.isArray(hooks) && hooks.some(
						(inner: unknown) => typeof inner === "object" && inner !== null && "command" in inner &&
							String((inner as { command: string }).command).includes("openpaw-hooks"),
					);
				}
				return false;
			},
		);

		if (!hasOurHook) {
			(preToolUse as unknown[]).push({
				matcher: "Bash",
				hooks: [
					{
						type: "command",
						command: scriptPath,
						timeout: 5,
					},
				],
			});
			(settings.hooks as Record<string, unknown[]>).PreToolUse = preToolUse;
			writeSettings(settings);
		}

		return true;
	} catch {
		return false;
	}
}

export function removeSafetyHooks(): boolean {
	try {
		// Remove hooks directory
		if (fs.existsSync(HOOKS_DIR)) {
			fs.rmSync(HOOKS_DIR, { recursive: true, force: true });
		}

		// Remove hook from settings.json
		const settings = readSettings();
		if (settings.hooks && (settings.hooks as Record<string, unknown[]>).PreToolUse) {
			const preToolUse = (settings.hooks as Record<string, unknown[]>).PreToolUse;
			if (Array.isArray(preToolUse)) {
				(settings.hooks as Record<string, unknown[]>).PreToolUse = preToolUse.filter(
					(h: unknown) => {
						if (typeof h === "object" && h !== null && "hooks" in h) {
							const hooks = (h as { hooks: unknown[] }).hooks;
							return !(Array.isArray(hooks) && hooks.some(
								(inner: unknown) => typeof inner === "object" && inner !== null && "command" in inner &&
									String((inner as { command: string }).command).includes("openpaw-hooks"),
							));
						}
						return true;
					},
				);
				writeSettings(settings);
			}
		}

		return true;
	} catch {
		return false;
	}
}
