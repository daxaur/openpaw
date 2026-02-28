import type { CliTool, Skill } from "../types.js";

// ── CLI Tool Definitions ──

const memo: CliTool = { name: "memo", command: "memo", installCmd: "brew install steipete/tap/memo", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const remindctl: CliTool = { name: "remindctl", command: "remindctl", installCmd: "brew install steipete/tap/remindctl", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const obsidianCli: CliTool = { name: "obsidian-cli", command: "obsidian-cli", installCmd: "brew install yakitrak/yakitrak/obsidian-cli", installMethod: "brew-tap", tap: "yakitrak/yakitrak", platforms: ["darwin", "linux", "win32"] };
const notionCli: CliTool = { name: "notion-cli", command: "notion-cli", installCmd: "npm install -g notion-cli-tool", installMethod: "npm", platforms: ["darwin", "linux", "win32"] };
const todoistCli: CliTool = { name: "todoist-cli", command: "todoist", installCmd: "brew install todoist-cli", installMethod: "brew", platforms: ["darwin", "linux"] };
const thingsCli: CliTool = { name: "things-cli", command: "things-cli", installCmd: "pip3 install things-cli", installMethod: "pip", platforms: ["darwin"] };
const taskwarrior: CliTool = { name: "taskwarrior", command: "task", installCmd: "brew install task", installMethod: "brew", platforms: ["darwin", "linux"] };
const gogcli: CliTool = { name: "gogcli", command: "gog", installCmd: "brew install steipete/tap/gogcli", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin", "linux", "win32"] };
const himalaya: CliTool = { name: "himalaya", command: "himalaya", installCmd: "brew install himalaya", installMethod: "brew", platforms: ["darwin", "linux"] };
const icalpal: CliTool = { name: "icalpal", command: "icalpal", installCmd: "brew install icalpal", installMethod: "brew", platforms: ["darwin"] };
const imsg: CliTool = { name: "imsg", command: "imsg", installCmd: "brew install steipete/tap/imsg", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const wacli: CliTool = { name: "wacli", command: "wacli", installCmd: "brew install steipete/tap/wacli", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const slackCli: CliTool = { name: "slack-cli", command: "slack", installCmd: "brew tap rockymadden/rockymadden && brew install rockymadden/rockymadden/slack-cli", installMethod: "brew-tap", tap: "rockymadden/rockymadden", platforms: ["darwin", "linux"] };
const bird: CliTool = { name: "bird", command: "bird", installCmd: "brew install steipete/tap/bird", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin", "linux", "win32"] };
const spogo: CliTool = { name: "spogo", command: "spogo", installCmd: "brew install steipete/tap/spogo", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin", "linux", "win32"] };
const ytdlp: CliTool = { name: "yt-dlp", command: "yt-dlp", installCmd: "brew install yt-dlp", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };
const ffmpeg: CliTool = { name: "ffmpeg", command: "ffmpeg", installCmd: "brew install ffmpeg", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };
const peekaboo: CliTool = { name: "peekaboo", command: "peekaboo", installCmd: "brew install steipete/tap/peekaboo", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const camsnap: CliTool = { name: "camsnap", command: "camsnap", installCmd: "brew install steipete/tap/camsnap", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const sag: CliTool = { name: "sag", command: "sag", installCmd: "brew install steipete/tap/sag", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const openhue: CliTool = { name: "openhue", command: "openhue", installCmd: "brew install openhue-cli", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };
const sonoscli: CliTool = { name: "sonoscli", command: "sonos", installCmd: "brew install steipete/tap/sonoscli", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin", "linux", "win32"] };
const blucli: CliTool = { name: "blucli", command: "blu", installCmd: "brew install steipete/tap/blucli", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const summarize: CliTool = { name: "summarize", command: "summarize", installCmd: "brew install steipete/tap/summarize", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin", "linux", "win32"] };
const goplaces: CliTool = { name: "goplaces", command: "goplaces", installCmd: "brew install steipete/tap/goplaces", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const ordercli: CliTool = { name: "ordercli", command: "ordercli", installCmd: "brew install steipete/tap/ordercli", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin", "linux", "win32"] };
const onepassCli: CliTool = { name: "1password-cli", command: "op", installCmd: "brew install --cask 1password-cli", installMethod: "brew-cask", platforms: ["darwin", "linux", "win32"] };
const bitwardenCli: CliTool = { name: "bitwarden-cli", command: "bw", installCmd: "npm install -g @bitwarden/cli", installMethod: "npm", platforms: ["darwin", "linux", "win32"] };
const gh: CliTool = { name: "gh", command: "gh", installCmd: "brew install gh", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };
const jq: CliTool = { name: "jq", command: "jq", installCmd: "brew install jq", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };
const linearCli: CliTool = { name: "linear-cli", command: "linear", installCmd: "npm install -g @linear/cli", installMethod: "npm", platforms: ["darwin", "linux", "win32"] };
const jiraCli: CliTool = { name: "jira-cli", command: "jira", installCmd: "brew install jira-cli", installMethod: "brew", platforms: ["darwin", "linux"] };

// ── Skill Catalog ──

export const skills: Skill[] = [
	// ── Productivity ──
	{
		id: "notes",
		name: "Notes & Reminders",
		description: "Read/write Apple Notes, manage Apple Reminders",
		category: "productivity",
		tools: [memo, remindctl],
		platforms: ["darwin"],
	},
	{
		id: "obsidian",
		name: "Obsidian",
		description: "Manage Obsidian vaults — open, search, navigate notes",
		category: "productivity",
		tools: [obsidianCli],
		platforms: ["darwin", "linux", "win32"],
	},
	{
		id: "notion",
		name: "Notion",
		description: "Manage Notion pages and databases from the CLI",
		category: "productivity",
		tools: [notionCli],
		platforms: ["darwin", "linux", "win32"],
	},
	{
		id: "tasks",
		name: "Tasks",
		description: "Task management — Todoist, Things 3, or Taskwarrior",
		category: "productivity",
		tools: [],
		platforms: ["darwin", "linux"],
		subChoices: {
			question: "Which task manager?",
			options: [
				{ label: "Todoist", value: "todoist", tools: [todoistCli] },
				{ label: "Things 3 (macOS)", value: "things", tools: [thingsCli] },
				{ label: "Taskwarrior (local)", value: "taskwarrior", tools: [taskwarrior] },
			],
		},
	},

	// ── Communication ──
	{
		id: "email",
		name: "Email",
		description: "Read, send, and search email — Gmail or IMAP",
		category: "communication",
		tools: [],
		platforms: ["darwin", "linux", "win32"],
		subChoices: {
			question: "Which email provider?",
			options: [
				{ label: "Gmail (Google)", value: "gmail", tools: [gogcli] },
				{ label: "IMAP (any provider)", value: "imap", tools: [himalaya] },
				{ label: "Both", value: "both", tools: [gogcli, himalaya] },
			],
		},
		authSteps: [
			{ tool: "gogcli", command: "gog auth", description: "Sign into Google" },
			{ tool: "himalaya", command: "himalaya account configure", description: "Configure IMAP account" },
		],
	},
	{
		id: "calendar",
		name: "Calendar",
		description: "View and manage calendar events",
		category: "communication",
		tools: [],
		platforms: ["darwin", "linux", "win32"],
		subChoices: {
			question: "Which calendar?",
			options: [
				{ label: "Google Calendar", value: "google", tools: [gogcli] },
				{ label: "Apple Calendar (macOS)", value: "apple", tools: [icalpal] },
				{ label: "Both", value: "both", tools: [gogcli, icalpal] },
			],
		},
		authSteps: [
			{ tool: "gogcli", command: "gog auth", description: "Sign into Google" },
		],
	},
	{
		id: "messaging",
		name: "Messaging",
		description: "Send/read iMessage and WhatsApp",
		category: "communication",
		tools: [imsg, wacli],
		platforms: ["darwin"],
		authSteps: [
			{ tool: "wacli", command: "wacli auth", description: "Scan QR code for WhatsApp" },
		],
	},
	{
		id: "slack",
		name: "Slack",
		description: "Send messages and files to Slack channels",
		category: "communication",
		tools: [slackCli],
		platforms: ["darwin", "linux"],
		authSteps: [
			{ tool: "slack-cli", command: "slack init", description: "Configure Slack token" },
		],
	},
	{
		id: "social",
		name: "Social / Twitter",
		description: "Post tweets, read timeline, search Twitter/X",
		category: "communication",
		tools: [bird],
		platforms: ["darwin", "linux", "win32"],
		authSteps: [
			{ tool: "bird", command: "bird auth", description: "Connect Twitter/X" },
		],
	},

	// ── Media ──
	{
		id: "music",
		name: "Music / Spotify",
		description: "Play, pause, skip, search, queue on Spotify",
		category: "media",
		tools: [spogo],
		platforms: ["darwin", "linux", "win32"],
		authSteps: [
			{ tool: "spogo", command: "spogo auth", description: "Connect Spotify" },
		],
	},
	{
		id: "video",
		name: "Video / YouTube",
		description: "Download videos, extract audio, convert formats",
		category: "media",
		tools: [ytdlp, ffmpeg],
		platforms: ["darwin", "linux", "win32"],
	},
	{
		id: "screen",
		name: "Screen & Vision",
		description: "Screenshots, OCR, screen analysis, webcam capture",
		category: "media",
		tools: [peekaboo, camsnap],
		platforms: ["darwin"],
	},
	{
		id: "voice",
		name: "Voice",
		description: "Speech-to-text and text-to-speech",
		category: "media",
		tools: [sag],
		platforms: ["darwin"],
	},

	// ── Smart Home ──
	{
		id: "lights",
		name: "Lights / Hue",
		description: "Control Philips Hue lights — on/off, brightness, color",
		category: "smart-home",
		tools: [openhue],
		platforms: ["darwin", "linux", "win32"],
		authSteps: [
			{ tool: "openhue", command: "openhue setup", description: "Press Hue Bridge button" },
		],
	},
	{
		id: "speakers",
		name: "Speakers / Sonos",
		description: "Control Sonos speakers — play, volume, grouping",
		category: "smart-home",
		tools: [sonoscli],
		platforms: ["darwin", "linux", "win32"],
	},
	{
		id: "bluetooth",
		name: "Bluetooth",
		description: "List, connect, disconnect Bluetooth devices",
		category: "smart-home",
		tools: [blucli],
		platforms: ["darwin"],
	},

	// ── Research & Utilities ──
	{
		id: "research",
		name: "Web Research",
		description: "Summarize URLs, PDFs, YouTube videos",
		category: "research",
		tools: [summarize],
		platforms: ["darwin", "linux", "win32"],
	},
	{
		id: "location",
		name: "Location / Maps",
		description: "Search Apple Maps, find nearby places",
		category: "research",
		tools: [goplaces],
		platforms: ["darwin"],
	},
	{
		id: "tracking",
		name: "Package Tracking",
		description: "Track packages across UPS, FedEx, USPS, DHL",
		category: "research",
		tools: [ordercli],
		platforms: ["darwin", "linux", "win32"],
	},
	{
		id: "secrets",
		name: "Passwords",
		description: "Access password vault — 1Password or Bitwarden",
		category: "research",
		tools: [],
		platforms: ["darwin", "linux", "win32"],
		subChoices: {
			question: "Which password manager?",
			options: [
				{ label: "1Password", value: "1password", tools: [onepassCli] },
				{ label: "Bitwarden", value: "bitwarden", tools: [bitwardenCli] },
			],
		},
		authSteps: [
			{ tool: "1password-cli", command: "op signin", description: "Sign into 1Password" },
			{ tool: "bitwarden-cli", command: "bw login", description: "Sign into Bitwarden" },
		],
	},

	// ── Developer ──
	{
		id: "github",
		name: "GitHub",
		description: "PRs, issues, repos, actions — GitHub from the CLI",
		category: "developer",
		tools: [gh, jq],
		platforms: ["darwin", "linux", "win32"],
		authSteps: [
			{ tool: "gh", command: "gh auth login", description: "Sign into GitHub" },
		],
	},
	{
		id: "linear",
		name: "Linear",
		description: "Manage Linear issues, projects, and cycles",
		category: "developer",
		tools: [linearCli],
		platforms: ["darwin", "linux", "win32"],
		authSteps: [
			{ tool: "linear-cli", command: "linear auth", description: "Sign into Linear" },
		],
	},
	{
		id: "jira",
		name: "Jira",
		description: "Manage Jira issues, sprints, and boards",
		category: "developer",
		tools: [jiraCli],
		platforms: ["darwin", "linux"],
		authSteps: [
			{ tool: "jira-cli", command: "jira init", description: "Configure Jira instance" },
		],
	},
];

export const categoryLabels: Record<string, string> = {
	productivity: "Productivity",
	communication: "Communication",
	media: "Media & Entertainment",
	"smart-home": "Smart Home",
	research: "Research & Utilities",
	developer: "Developer",
};

export function getSkillById(id: string): Skill | undefined {
	return skills.find((s) => s.id === id);
}

export function getSkillsForPlatform(platform: string): Skill[] {
	return skills.filter((s) => s.platforms.includes(platform as "darwin" | "linux" | "win32"));
}

export function getSkillsByCategory(platform: string): Map<string, Skill[]> {
	const available = getSkillsForPlatform(platform);
	const grouped = new Map<string, Skill[]>();
	for (const skill of available) {
		const existing = grouped.get(skill.category) ?? [];
		existing.push(skill);
		grouped.set(skill.category, existing);
	}
	return grouped;
}

export function getAllTaps(selectedSkills: Skill[]): Set<string> {
	const taps = new Set<string>();
	for (const skill of selectedSkills) {
		for (const tool of skill.tools) {
			if (tool.tap) taps.add(tool.tap);
		}
	}
	return taps;
}
