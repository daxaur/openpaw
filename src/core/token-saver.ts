import { execSync } from "node:child_process";
import { readSettings, writeSettings } from "./permissions.js";

// rtk (Rust Token Killer) compresses verbose command output before it reaches
// the model — git status/diff/log, ls, build logs, etc. — typically 40–90%
// fewer tokens. It's a separate brew binary; OpenPaw only wires it up if the
// user opts in. Wired as a PreToolUse hook on Bash that calls `rtk hook claude`.
const RTK_HOOK_CMD = "rtk hook claude";

export function rtkInstalled(): boolean {
	try {
		execSync("command -v rtk", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

/** Install rtk via Homebrew. Returns true on success. */
export function installRtk(): boolean {
	try {
		execSync("brew install rtk", { stdio: "ignore" });
		return rtkInstalled();
	} catch {
		return false;
	}
}

function hasRtkHook(preToolUse: unknown[]): boolean {
	return (
		Array.isArray(preToolUse) &&
		preToolUse.some((h: unknown) => {
			if (typeof h === "object" && h !== null && "hooks" in h) {
				const hooks = (h as { hooks: unknown[] }).hooks;
				return (
					Array.isArray(hooks) &&
					hooks.some(
						(inner: unknown) =>
							typeof inner === "object" &&
							inner !== null &&
							"command" in inner &&
							String((inner as { command: string }).command).includes(
								"rtk hook",
							),
					)
				);
			}
			return false;
		})
	);
}

export function rtkHookInstalled(): boolean {
	const settings = readSettings();
	const preToolUse =
		(settings.hooks as Record<string, unknown[]>)?.PreToolUse ?? [];
	return hasRtkHook(preToolUse as unknown[]);
}

/** Wire `rtk hook claude` as a PreToolUse hook on Bash. */
export function installRtkHook(): boolean {
	try {
		const settings = readSettings();
		if (!settings.hooks) settings.hooks = {};
		const hooks = settings.hooks as Record<string, unknown[]>;
		const preToolUse = (hooks.PreToolUse ?? []) as unknown[];

		if (!hasRtkHook(preToolUse)) {
			preToolUse.push({
				matcher: "Bash",
				hooks: [{ type: "command", command: RTK_HOOK_CMD }],
			});
			hooks.PreToolUse = preToolUse;
			writeSettings(settings);
		}
		return true;
	} catch {
		return false;
	}
}

export function removeRtkHook(): boolean {
	try {
		const settings = readSettings();
		const hooks = settings.hooks as Record<string, unknown[]> | undefined;
		if (hooks?.PreToolUse && Array.isArray(hooks.PreToolUse)) {
			hooks.PreToolUse = (hooks.PreToolUse as unknown[]).filter(
				(h: unknown) => {
					if (typeof h === "object" && h !== null && "hooks" in h) {
						const inner = (h as { hooks: unknown[] }).hooks;
						return !(
							Array.isArray(inner) &&
							inner.some(
								(x: unknown) =>
									typeof x === "object" &&
									x !== null &&
									"command" in x &&
									String((x as { command: string }).command).includes(
										"rtk hook",
									),
							)
						);
					}
					return true;
				},
			);
			writeSettings(settings);
		}
		return true;
	} catch {
		return false;
	}
}
