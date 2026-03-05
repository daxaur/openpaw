import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const OPENPAW_CONFIG_DIR = path.join(os.homedir(), ".config", "openpaw");
const OPENPAW_THEME_BACKUP_PATH = path.join(OPENPAW_CONFIG_DIR, "claude-theme-backup.json");
const OPENPAW_PATCH_SCRIPT_PATH = path.join(OPENPAW_CONFIG_DIR, "claude-theme-patch.js");
const TWEAKCC_CONFIG_DIR = path.join(os.homedir(), ".tweakcc");
const TWEAKCC_CONFIG_PATH = path.join(TWEAKCC_CONFIG_DIR, "config.json");

const OPENPAW_THEME_ID = "openpaw";
const OPENPAW_THEME_NAME = "OpenPaw";
const OPENPAW_HIGHLIGHTER_PREFIX = "OpenPaw:";
const OPENPAW_VERIFY_MASCOT_ASCII = '" ( ^.^ )  paw"';
const OPENPAW_VERIFY_MASCOT_COLOR = 'clawd_body:"rgb(224,164,110)"';
const OPENPAW_VERIFY_WELCOME = "Welcome to Paw for ";

interface JsonRecord {
	[key: string]: unknown;
}

interface ThemeBackup {
	hadConfig: boolean;
	config: JsonRecord | null;
	savedAt: string;
}

export interface ThemeApplyReport {
	failedPatches: string[];
	fallbackPatchApplied: boolean;
	fallbackPatchPath: string;
	themePatchAvailable: boolean;
	tweakccOutput: string;
}

export interface ThemeVerifyReport {
	configured: boolean;
	markers: {
		mascotAscii: boolean;
		mascotColors: boolean;
		welcomeCopy: boolean;
	};
	verified: boolean;
}

const OPENPAW_THEME_COLORS = {
	autoAccept: "rgb(215,166,106)",
	bashBorder: "rgb(201,126,78)",
	claude: "rgb(214,143,92)",
	claudeShimmer: "rgb(236,191,133)",
	claudeBlue_FOR_SYSTEM_SPINNER: "rgb(160,117,70)",
	claudeBlueShimmer_FOR_SYSTEM_SPINNER: "rgb(212,173,118)",
	permission: "rgb(206,156,96)",
	permissionShimmer: "rgb(234,198,145)",
	planMode: "rgb(127,92,57)",
	ide: "rgb(124,161,133)",
	promptBorder: "rgb(147,110,77)",
	promptBorderShimmer: "rgb(214,180,140)",
	text: "rgb(252,245,233)",
	inverseText: "rgb(37,24,17)",
	inactive: "rgb(174,149,121)",
	subtle: "rgb(92,68,53)",
	suggestion: "rgb(230,190,135)",
	remember: "rgb(176,203,162)",
	background: "rgb(99,71,52)",
	success: "rgb(136,184,118)",
	error: "rgb(229,126,104)",
	warning: "rgb(237,191,108)",
	warningShimmer: "rgb(247,220,158)",
	diffAdded: "rgb(42,71,44)",
	diffRemoved: "rgb(98,49,41)",
	diffAddedDimmed: "rgb(74,92,70)",
	diffRemovedDimmed: "rgb(98,75,68)",
	diffAddedWord: "rgb(110,171,112)",
	diffRemovedWord: "rgb(207,111,93)",
	diffAddedWordDimmed: "rgb(78,118,79)",
	diffRemovedWordDimmed: "rgb(140,80,68)",
	red_FOR_SUBAGENTS_ONLY: "rgb(224,99,84)",
	blue_FOR_SUBAGENTS_ONLY: "rgb(111,160,198)",
	green_FOR_SUBAGENTS_ONLY: "rgb(117,186,123)",
	yellow_FOR_SUBAGENTS_ONLY: "rgb(230,190,99)",
	purple_FOR_SUBAGENTS_ONLY: "rgb(177,139,201)",
	orange_FOR_SUBAGENTS_ONLY: "rgb(214,143,92)",
	pink_FOR_SUBAGENTS_ONLY: "rgb(215,130,151)",
	cyan_FOR_SUBAGENTS_ONLY: "rgb(111,184,178)",
	professionalBlue: "rgb(128,152,176)",
	rainbow_red: "rgb(230,122,97)",
	rainbow_orange: "rgb(235,164,100)",
	rainbow_yellow: "rgb(241,202,116)",
	rainbow_green: "rgb(139,186,119)",
	rainbow_blue: "rgb(119,162,205)",
	rainbow_indigo: "rgb(153,137,204)",
	rainbow_violet: "rgb(201,144,182)",
	rainbow_red_shimmer: "rgb(244,165,146)",
	rainbow_orange_shimmer: "rgb(245,191,136)",
	rainbow_yellow_shimmer: "rgb(248,223,162)",
	rainbow_green_shimmer: "rgb(184,220,166)",
	rainbow_blue_shimmer: "rgb(166,198,230)",
	rainbow_indigo_shimmer: "rgb(195,182,232)",
	rainbow_violet_shimmer: "rgb(226,185,209)",
	clawd_body: "rgb(224,164,110)",
	clawd_background: "rgb(32,20,13)",
	userMessageBackground: "rgb(70,49,37)",
	bashMessageBackgroundColor: "rgb(63,47,43)",
	memoryBackgroundColor: "rgb(58,61,52)",
	rate_limit_fill: "rgb(221,178,117)",
	rate_limit_empty: "rgb(79,60,46)",
} satisfies Record<string, string>;

const OPENPAW_THEME = {
	name: OPENPAW_THEME_NAME,
	id: OPENPAW_THEME_ID,
	colors: OPENPAW_THEME_COLORS,
};

const OPENPAW_THINKING_VERBS = {
	format: "Paw is {}… ",
	verbs: [
		"sniffing",
		"padding",
		"tail-wagging",
		"tracking",
		"fetching",
		"prowling",
		"listening",
		"watching",
		"guiding",
		"guarding",
	],
};

const OPENPAW_THINKING_STYLE = {
	updateInterval: 90,
	phases: ["·", "◔", "◑", "◕", "●", "🐾"],
	reverseMirror: true,
};

const OPENPAW_USER_MESSAGE_DISPLAY = {
	format: " 🐾 {} ",
	styling: ["bold"],
	foregroundColor: "rgb(252,245,233)",
	backgroundColor: "rgb(70,49,37)",
	borderStyle: "round",
	borderColor: "rgb(201,126,78)",
	paddingX: 1,
	paddingY: 0,
	fitBoxToContent: false,
};

const OPENPAW_INPUT_HIGHLIGHTERS = [
	{
		name: `${OPENPAW_HIGHLIGHTER_PREFIX} commands`,
		regex: "\\b(?:openpaw|claude|tweakcc)\\b",
		regexFlags: "gi",
		format: "{MATCH}",
		styling: ["bold"],
		foregroundColor: "rgb(236,191,133)",
		backgroundColor: null,
		enabled: true,
	},
	{
		name: `${OPENPAW_HIGHLIGHTER_PREFIX} skills`,
		regex: "\\bc-[a-z][a-z0-9-]*\\b",
		regexFlags: "g",
		format: "{MATCH}",
		styling: ["bold"],
		foregroundColor: "rgb(176,203,162)",
		backgroundColor: null,
		enabled: true,
	},
	{
		name: `${OPENPAW_HIGHLIGHTER_PREFIX} slash commands`,
		regex: "(?:^|\\s)/(?:theme|model|toolset|memory|agents?|doctor|status)\\b",
		regexFlags: "gi",
		format: "{MATCH}",
		styling: ["bold"],
		foregroundColor: "rgb(177,139,201)",
		backgroundColor: null,
		enabled: true,
	},
];

function commandExists(cmd: string): boolean {
	try {
		if (process.platform === "win32") {
			execFileSync("where", [cmd], { stdio: "ignore" });
		} else {
			execFileSync("which", [cmd], { stdio: "ignore" });
		}
		return true;
	} catch {
		return false;
	}
}

function ensureDir(filePath: string): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath: string): JsonRecord | null {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf-8")) as JsonRecord;
	} catch {
		return null;
	}
}

function writeJson(filePath: string, value: unknown): void {
	ensureDir(filePath);
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function cloneRecord<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function getSettings(config: JsonRecord): JsonRecord {
	const current = config.settings;
	if (!current || typeof current !== "object" || Array.isArray(current)) {
		config.settings = {};
	}
	return config.settings as JsonRecord;
}

function getArray<T = JsonRecord>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

function getObject(value: unknown): JsonRecord {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as JsonRecord)
		: {};
}

function buildPatchedConfig(baseConfig: JsonRecord): JsonRecord {
	const config = cloneRecord(baseConfig);
	const settings = getSettings(config);

	const themes = getArray(settings.themes).filter(
		(theme) => getObject(theme).id !== OPENPAW_THEME_ID,
	);
	themes.push(cloneRecord(OPENPAW_THEME));
	settings.themes = themes;

	settings.thinkingVerbs = cloneRecord(OPENPAW_THINKING_VERBS);
	settings.thinkingStyle = cloneRecord(OPENPAW_THINKING_STYLE);
	settings.userMessageDisplay = cloneRecord(OPENPAW_USER_MESSAGE_DISPLAY);
	settings.inputBox = {
		...getObject(settings.inputBox),
		removeBorder: true,
	};
	settings.misc = {
		...getObject(settings.misc),
		hideStartupClawd: false,
		hideStartupBanner: false,
		expandThinkingBlocks: true,
	};

	const otherHighlighters = getArray(settings.inputPatternHighlighters).filter((entry) => {
		const name = getObject(entry).name;
		return typeof name !== "string" || !name.startsWith(OPENPAW_HIGHLIGHTER_PREFIX);
	});
	settings.inputPatternHighlighters = [
		...otherHighlighters,
		...cloneRecord(OPENPAW_INPUT_HIGHLIGHTERS),
	];
	settings.inputPatternHighlightersTestText =
		"openpaw theme apply paw /theme c-email c-calendar";

	return config;
}

function resolveTweakccCommand(args: string[]): { command: string; args: string[] } {
	if (commandExists("tweakcc")) {
		return { command: "tweakcc", args };
	}

	return { command: "npx", args: ["-y", "tweakcc@latest", ...args] };
}

function runTweakcc(args: string[], options?: { captureOutput?: boolean }): string {
	const captureOutput = options?.captureOutput ?? false;
	const invocation = resolveTweakccCommand(args);

	if (!captureOutput) {
		execFileSync(invocation.command, invocation.args, { stdio: "inherit" });
		return "";
	}

	const result = spawnSync(invocation.command, invocation.args, {
		encoding: "utf-8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	const stdout = result.stdout ?? "";
	const stderr = result.stderr ?? "";
	const combined = `${stdout}${stderr}`;

	if (combined) {
		process.stdout.write(combined);
	}

	if (result.status !== 0) {
		throw new Error(
			combined.trim() || `tweakcc exited with status ${result.status ?? "unknown"}.`,
		);
	}

	return combined;
}

function stripAnsi(value: string): string {
	return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function parseFailedPatches(output: string): string[] {
	const clean = stripAnsi(output);
	return clean
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.startsWith("✗ "))
		.map((line) => line.slice(2).split(":")[0].trim())
		.filter(Boolean);
}

function buildOpenPawAdhocPatchScript(): string {
	const mascotLines = [
		"  /\\_/\\\\",
		" ( ^.^ )  paw",
		"  > ^ <",
	];
	const serializedLines = mascotLines.map((line) => `\`${line.replace(/\\/g, "\\\\")}\``).join(",");

	return `const replacements = [
	["Welcome to Claude Code for ","Welcome to Paw for "],
	["\\\\u2022 Claude has context of ","\\\\u2022 Paw has context from "],
	["\\\\u2022 Review Claude Code's changes","\\\\u2022 Review Paw's changes"],
	["Press Enter to continue","Press Enter to continue with Paw"],
	['clawd_body:"rgb(215,119,87)"','clawd_body:"rgb(224,164,110)"'],
	['clawd_background:"rgb(0,0,0)"','clawd_background:"rgb(32,20,13)"'],
	['clawd_body:"ansi:redBright"','clawd_body:"ansi:yellow"'],
];

function applyReplacements(source) {
	let next = source;
	for (const [from, to] of replacements) {
		if (next.includes(from)) {
			next = next.replaceAll(from, to);
		}
	}
	return next;
}

function findLastFunctionStart(source, offset) {
	const prefix = source.slice(0, offset);
	const matches = [...prefix.matchAll(/function ([$\\w]+)\\(\\)\\{/g)];
	const match = matches.at(-1);
	return match ? { name: match[1], index: match.index } : null;
}

function findMatchingBrace(source, openBraceIndex) {
	let depth = 0;
	let quote = null;
	for (let index = openBraceIndex; index < source.length; index += 1) {
		const char = source[index];
		const previous = source[index - 1];
		if (quote) {
			if (char === quote && previous !== "\\\\") {
				quote = null;
			}
			continue;
		}
		if (char === "'" || char === '"' || char === "\`") {
			quote = char;
			continue;
		}
		if (char === "{") {
			depth += 1;
			continue;
		}
		if (char === "}") {
			depth -= 1;
			if (depth === 0) {
				return index;
			}
		}
	}
	throw new Error("Could not find end of mascot function.");
}

function replaceMascot(source) {
	const mascotMarker = "\\\\u259B\\\\u2588\\\\u2588\\\\u2588\\\\u259C";
	const markerIndex = source.indexOf(mascotMarker);
	if (markerIndex === -1) {
		throw new Error("Could not find Claude Code startup mascot.");
	}

	const functionInfo = findLastFunctionStart(source, markerIndex);
	if (!functionInfo) {
		throw new Error("Could not locate mascot function start.");
	}

	const openBraceIndex = source.indexOf("{", functionInfo.index);
	const closeBraceIndex = findMatchingBrace(source, openBraceIndex);
	const original = source.slice(functionInfo.index, closeBraceIndex + 1);
	const cacheMatch = original.match(/let [$_\\w]+=([$_\\w]+)\\.c\\(\\d+\\)/);
	const reactMatch = original.match(/([$_\\w]+)\\.createElement\\(k,/);
	if (!cacheMatch || !reactMatch) {
		throw new Error("Could not resolve mascot render variables.");
	}

	const cacheVar = cacheMatch[1];
	const reactVar = reactMatch[1];
	const mascotLines = [${serializedLines}];
	const mascotChildren = mascotLines
		.map((line) => \`\${reactVar}.createElement(k,{color:"clawd_body"},\${JSON.stringify(line)})\`)
		.join(",");
	const replacement =
		\`function \${functionInfo.name}(){let T=\${cacheVar}.c(1),_;if(T[0]===Symbol.for("react.memo_cache_sentinel"))_=\${reactVar}.createElement(B,{flexDirection:"column",alignItems:"center"},\${mascotChildren}),T[0]=_;else _=T[0];return _}\`;

	return source.slice(0, functionInfo.index) + replacement + source.slice(closeBraceIndex + 1);
}

js = applyReplacements(js);
js = replaceMascot(js);
return js;
`;
}

function applyOpenPawFallbackPatch(): void {
	ensureDir(OPENPAW_PATCH_SCRIPT_PATH);
	fs.writeFileSync(OPENPAW_PATCH_SCRIPT_PATH, buildOpenPawAdhocPatchScript(), "utf-8");
	runTweakcc([
		"adhoc-patch",
		"--script",
		`@${OPENPAW_PATCH_SCRIPT_PATH}`,
		"--confirm-possible-dangerous-patch",
	]);
}

function readInstalledClaudeJs(): string {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "openpaw-claude-verify-"));
	const outputPath = path.join(tempDir, "claude.js");
	const invocation = resolveTweakccCommand(["unpack", outputPath]);
	const result = spawnSync(invocation.command, invocation.args, {
		encoding: "utf-8",
		stdio: ["ignore", "pipe", "pipe"],
	});

	try {
		if (result.status !== 0) {
			const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
			throw new Error(output || "Failed to unpack Claude Code for verification.");
		}

		return fs.readFileSync(outputPath, "utf-8");
	} finally {
		try {
			fs.rmSync(tempDir, { recursive: true, force: true });
		} catch {}
	}
}

function saveBackup(config: JsonRecord | null): void {
	const backup: ThemeBackup = {
		hadConfig: config !== null,
		config,
		savedAt: new Date().toISOString(),
	};
	writeJson(OPENPAW_THEME_BACKUP_PATH, backup);
}

function readBackup(): ThemeBackup | null {
	const backup = readJson(OPENPAW_THEME_BACKUP_PATH);
	if (!backup) return null;
	return backup as unknown as ThemeBackup;
}

export function tweakccConfigExists(): boolean {
	return fs.existsSync(TWEAKCC_CONFIG_PATH);
}

export function readTweakccConfig(): JsonRecord | null {
	return readJson(TWEAKCC_CONFIG_PATH);
}

export function openPawThemeConfigured(): boolean {
	const config = readTweakccConfig();
	if (!config) return false;
	const settings = getObject(config.settings);
	return getArray(settings.themes).some((theme) => getObject(theme).id === OPENPAW_THEME_ID);
}

export function themeBackupExists(): boolean {
	return fs.existsSync(OPENPAW_THEME_BACKUP_PATH);
}

export function getTweakccConfigPath(): string {
	return TWEAKCC_CONFIG_PATH;
}

export function getOpenPawThemeName(): string {
	return OPENPAW_THEME_NAME;
}

export function verifyOpenPawTheme(): ThemeVerifyReport {
	const js = readInstalledClaudeJs();
	const markers = {
		mascotAscii: js.includes(OPENPAW_VERIFY_MASCOT_ASCII),
		mascotColors: js.includes(OPENPAW_VERIFY_MASCOT_COLOR),
		welcomeCopy: js.includes(OPENPAW_VERIFY_WELCOME),
	};

	return {
		configured: openPawThemeConfigured(),
		markers,
		verified: Object.values(markers).every(Boolean),
	};
}

export function applyOpenPawTheme(): ThemeApplyReport {
	const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] || "0", 10);
	if (nodeMajor < 20) {
		throw new Error("Claude Code theming requires Node.js 20+ because tweakcc requires it.");
	}

	const existingConfig = readTweakccConfig();
	saveBackup(existingConfig);

	const nextConfig = buildPatchedConfig(existingConfig ?? {});
	writeJson(TWEAKCC_CONFIG_PATH, nextConfig);
	const tweakccOutput = runTweakcc(["--apply"], { captureOutput: true });
	const failedPatches = parseFailedPatches(tweakccOutput);
	applyOpenPawFallbackPatch();

	return {
		failedPatches,
		fallbackPatchApplied: true,
		fallbackPatchPath: OPENPAW_PATCH_SCRIPT_PATH,
		themePatchAvailable: !failedPatches.includes("Themes"),
		tweakccOutput,
	};
}

export function restoreOpenPawTheme(): void {
	const backup = readBackup();
	if (!backup) {
		throw new Error("No OpenPaw Claude Code theme backup found.");
	}

	if (!backup.hadConfig || !backup.config) {
		try {
			fs.rmSync(TWEAKCC_CONFIG_PATH, { force: true });
		} catch {}
		runTweakcc(["--restore"]);
	} else {
		writeJson(TWEAKCC_CONFIG_PATH, backup.config);
		runTweakcc(["--apply"]);
	}

	try {
		fs.rmSync(OPENPAW_THEME_BACKUP_PATH, { force: true });
	} catch {}

	try {
		fs.rmSync(OPENPAW_PATCH_SCRIPT_PATH, { force: true });
	} catch {}
}
