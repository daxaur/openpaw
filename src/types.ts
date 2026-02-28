export type Platform = "darwin" | "linux" | "win32";

export interface CliTool {
	name: string;
	command: string;
	installCmd: string;
	installMethod: "brew" | "brew-tap" | "brew-cask" | "npm" | "pip" | "builtin";
	tap?: string;
	platforms: Platform[];
}

export interface Skill {
	id: string;
	name: string;
	description: string;
	category: SkillCategory;
	tools: CliTool[];
	platforms: Platform[];
	authSteps?: AuthStep[];
	subChoices?: SubChoice;
	depends?: string[];
}

export type SkillCategory =
	| "productivity"
	| "communication"
	| "media"
	| "smart-home"
	| "research"
	| "developer"
	| "automation"
	| "system";

export interface Preset {
	id: string;
	name: string;
	description: string;
	skillIds: string[];
}

export interface AuthStep {
	tool: string;
	command: string;
	description: string;
}

export interface SubChoice {
	question: string;
	options: { label: string; value: string; tools: CliTool[] }[];
}

export interface InstalledSkill {
	id: string;
	name: string;
	path: string;
	tools: { name: string; installed: boolean; version?: string }[];
}

export interface PlatformInfo {
	os: Platform;
	osName: string;
	osVersion: string;
	hasBrew: boolean;
	hasNpm: boolean;
	hasPip: boolean;
}

export interface SettingsJson {
	permissions?: {
		allow?: string[];
		deny?: string[];
		ask?: string[];
		defaultMode?: string;
		[key: string]: unknown;
	};
	hooks?: Record<string, unknown>;
	[key: string]: unknown;
}
