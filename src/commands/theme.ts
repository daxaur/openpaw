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
} from "../core/claude-theme.js";

export async function themeCommand(preset = "paw"): Promise<void> {
	await themeApplyCommand(preset);
}

export async function themeApplyCommand(preset = "paw"): Promise<void> {
	showMini();
	console.log("");

	if (preset !== "paw") {
		p.log.error(`Unknown theme preset: ${preset}`);
		p.log.info(`Available presets: ${bold("paw")}`);
		return;
	}

	p.log.info(`Applying ${accent(getOpenPawThemeName())} to Claude Code...`);
	p.log.info(dim("This uses tweakcc under the hood and preserves existing tweakcc config."));
	console.log("");

	try {
		applyOpenPawTheme();
		console.log("");
		p.log.success("Claude Code patched with the OpenPaw theme.");
		p.log.info(`Theme config: ${dim(getTweakccConfigPath())}`);
		p.log.info(`Switch inside Claude Code with: ${bold("/theme openpaw")}`);
		p.log.info(dim("If you're already using the dark theme, the new styling will be available after restarting Claude Code."));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		p.log.error(message);
	}
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
