import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";

const OPENPAW_CONFIG_DIR = path.join(os.homedir(), ".config", "openpaw");
const OPENPAW_THEME_BACKUP_PATH = path.join(OPENPAW_CONFIG_DIR, "claude-theme-backup.json");
const TWEAKCC_CONFIG_DIR = path.join(os.homedir(), ".tweakcc");
const TWEAKCC_CONFIG_PATH = path.join(TWEAKCC_CONFIG_DIR, "config.json");

const OPENPAW_THEME_ID = "openpaw";
const OPENPAW_THEME_NAME = "OpenPaw";
const OPENPAW_HIGHLIGHTER_PREFIX = "OpenPaw:";

interface JsonRecord {
	[key: string]: unknown;
}

interface ThemeBackup {
	hadConfig: boolean;
	config: JsonRecord | null;
	savedAt: string;
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
		hideStartupClawd: true,
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

function runTweakcc(args: string[]): void {
	if (commandExists("tweakcc")) {
		execFileSync("tweakcc", args, { stdio: "inherit" });
		return;
	}

	execFileSync("npx", ["-y", "tweakcc@latest", ...args], { stdio: "inherit" });
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

export function applyOpenPawTheme(): void {
	const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] || "0", 10);
	if (nodeMajor < 20) {
		throw new Error("Claude Code theming requires Node.js 20+ because tweakcc requires it.");
	}

	const existingConfig = readTweakccConfig();
	saveBackup(existingConfig);

	const nextConfig = buildPatchedConfig(existingConfig ?? {});
	writeJson(TWEAKCC_CONFIG_PATH, nextConfig);
	runTweakcc(["--apply"]);
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
}
