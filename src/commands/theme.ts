import * as p from "@clack/prompts";
import { showMini, accent, bold, dim } from "../core/branding.js";
import {
	applyOpenPawTheme,
	getOpenPawThemeName,
	getTweakccConfigPath,
	openPawThemeConfigured,
	readTweakccConfig,
	restoreOpenPawTheme,
	themeBackupExists,
	tweakccConfigExists,
	verifyOpenPawTheme,
} from "../core/claude-theme.js";

export async function themeCommand(preset = "paw"): Promise<void> {
	await themeInstallCommand(preset);
}

export async function themeInstallCommand(preset = "paw"): Promise<void> {
	showMini();
	console.log("");

	if (preset !== "paw") {
		p.log.error(`Unknown theme preset: ${preset}`);
		p.log.info(`Available presets: ${bold("paw")}`);
		return;
	}

	p.log.info(`Installing ${accent(getOpenPawThemeName())} into Claude Code...`);
	p.log.info(dim("This uses tweakcc under the hood, preserves existing tweakcc config, and applies an OpenPaw fallback patch for the mascot."));
	console.log("");

	try {
		const report = applyOpenPawTheme();
		const verification = verifyOpenPawTheme();
		console.log("");
		p.log.success("OpenPaw installed into Claude Code.");
		p.log.info(`Theme config: ${dim(getTweakccConfigPath())}`);
		p.log.info(`Mascot patch: ${dim(report.fallbackPatchPath)}`);
		if (report.themePatchAvailable) {
			p.log.info(`Switch inside Claude Code with: ${bold("/theme openpaw")}`);
		} else {
			p.log.warn("Claude Code accepted the Paw mascot patch, but the built-in /theme injection failed on this Claude Code version.");
		}
		if (report.failedPatches.length > 0) {
			p.log.warn(`tweakcc reported patch failures: ${dim(report.failedPatches.join(", "))}`);
		}
		if (verification.verified) {
			p.log.success("Verified Paw mascot, welcome copy, mascot colors, and lock-in status line.");
		} else {
			const missing = Object.entries(verification.markers)
				.filter(([, present]) => !present)
				.map(([name]) => name)
				.join(", ");
			p.log.warn(`Verification is incomplete. Missing markers: ${dim(missing)}`);
		}
		p.log.info(dim("Restart Claude Code to pick up the new mascot and patched welcome copy."));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		p.log.error(message);
	}
}

export async function themeApplyCommand(preset = "paw"): Promise<void> {
	await themeInstallCommand(preset);
}

export async function themeStatusCommand(): Promise<void> {
	showMini();
	console.log("");

	const tweakccConfig = readTweakccConfig();
	const lines = [
		`${bold("Preset:")}      ${openPawThemeConfigured() ? accent(getOpenPawThemeName()) : dim("not configured")}`,
		`${bold("Backup:")}      ${themeBackupExists() ? accent("available") : dim("none")}`,
		`${bold("tweakcc:")}     ${tweakccConfigExists() ? accent("configured") : dim("not configured")}`,
		`${bold("Config path:")} ${dim(getTweakccConfigPath())}`,
	];

	if (tweakccConfig) {
		const themeCount = Array.isArray((tweakccConfig.settings as { themes?: unknown[] } | undefined)?.themes)
			? ((tweakccConfig.settings as { themes: unknown[] }).themes.length)
			: 0;
		lines.push(`${bold("Themes:")}      ${themeCount} registered`);
	}

	p.note(lines.join("\n"), "Claude Code Theme");
}

export async function themeVerifyCommand(): Promise<void> {
	showMini();
	console.log("");

	try {
		const verification = verifyOpenPawTheme();
		const lines = [
			`${bold("Configured:")}    ${verification.configured ? accent("yes") : dim("no")}`,
			`${bold("Mascot ASCII:")} ${verification.markers.mascotAscii ? accent("found") : dim("missing")}`,
			`${bold("Mascot color:")} ${verification.markers.mascotColors ? accent("found") : dim("missing")}`,
			`${bold("Welcome copy:")} ${verification.markers.welcomeCopy ? accent("found") : dim("missing")}`,
			`${bold("Status line:")}  ${verification.markers.statusLine ? accent("found") : dim("missing")}`,
			`${bold("Verified:")}     ${verification.verified ? accent("yes") : dim("no")}`,
		];
		p.note(lines.join("\n"), "OpenPaw Verify");
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		p.log.error(message);
	}
}

export async function themeRestoreCommand(): Promise<void> {
	showMini();
	console.log("");

	if (!themeBackupExists()) {
		p.log.warn("No OpenPaw Claude Code theme backup found.");
		return;
	}

	const confirm = await p.confirm({
		message: "Restore Claude Code to the pre-OpenPaw theme state?",
		initialValue: true,
	});

	if (p.isCancel(confirm) || !confirm) {
		p.cancel("Theme restore cancelled.");
		return;
	}

	try {
		restoreOpenPawTheme();
		console.log("");
		p.log.success("Claude Code restored to its previous theme state.");
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		p.log.error(message);
	}
}
