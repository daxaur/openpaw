import type { CliTool, Preset, Skill } from "../types.js";

// ── CLI Tool Definitions ──

const memo: CliTool = { name: "memo", command: "memo", installCmd: "brew install antoniorodr/memo/memo", installMethod: "brew-tap", tap: "antoniorodr/memo", platforms: ["darwin"] };
const remindctl: CliTool = { name: "remindctl", command: "remindctl", installCmd: "brew install steipete/tap/remindctl", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const obsidianCli: CliTool = { name: "obsidian-cli", command: "obsidian-cli", installCmd: "brew install yakitrak/yakitrak/obsidian-cli", installMethod: "brew-tap", tap: "yakitrak/yakitrak", platforms: ["darwin", "linux", "win32"] };
const notionCli: CliTool = { name: "notion-cli", command: "notion-cli", installCmd: "npm install -g @litencatt/notion-cli", installMethod: "npm", platforms: ["darwin", "linux", "win32"] };
const todoistCli: CliTool = { name: "todoist-cli", command: "todoist", installCmd: "brew install todoist-cli", installMethod: "brew", platforms: ["darwin", "linux"] };
const thingsCli: CliTool = { name: "things-cli", command: "things-cli", installCmd: "pipx install things-cli", installMethod: "pip", platforms: ["darwin"] };
const taskwarrior: CliTool = { name: "taskwarrior", command: "task", installCmd: "brew install task", installMethod: "brew", platforms: ["darwin", "linux"] };
const gogcli: CliTool = { name: "gogcli", command: "gog", installCmd: "brew install steipete/tap/gogcli", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin", "linux", "win32"] };
const himalaya: CliTool = { name: "himalaya", command: "himalaya", installCmd: "brew install himalaya", installMethod: "brew", platforms: ["darwin", "linux"] };
const icalBuddy: CliTool = { name: "ical-buddy", command: "icalBuddy", installCmd: "brew install ical-buddy", installMethod: "brew", platforms: ["darwin"] };
const imsg: CliTool = { name: "imsg", command: "imsg", installCmd: "brew install steipete/tap/imsg", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const wacli: CliTool = { name: "wacli", command: "wacli", installCmd: "brew install steipete/tap/wacli", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const slackCli: CliTool = { name: "slack-cli", command: "slack", installCmd: "npm install -g slack-cli", installMethod: "npm", platforms: ["darwin", "linux", "win32"] };
const spogo: CliTool = { name: "spogo", command: "spogo", installCmd: "brew install steipete/tap/spogo", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin", "linux", "win32"] };
const ytdlp: CliTool = { name: "yt-dlp", command: "yt-dlp", installCmd: "brew install yt-dlp", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };
const ffmpeg: CliTool = { name: "ffmpeg", command: "ffmpeg", installCmd: "brew install ffmpeg", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };
const peekaboo: CliTool = { name: "peekaboo", command: "peekaboo", installCmd: "brew install steipete/tap/peekaboo", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const camsnap: CliTool = { name: "camsnap", command: "camsnap", installCmd: "brew install steipete/tap/camsnap", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const sag: CliTool = { name: "sag", command: "sag", installCmd: "brew install steipete/tap/sag", installMethod: "brew-tap", tap: "steipete/tap", platforms: ["darwin"] };
const openhue: CliTool = { name: "openhue-cli", command: "openhue", installCmd: "brew install openhue/cli/openhue-cli", installMethod: "brew-tap", tap: "openhue/cli", platforms: ["darwin", "linux", "win32"] };
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

// ── New Tools: Browser ──
const agentBrowser: CliTool = { name: "agent-browser", command: "agent-browser", installCmd: "npm install -g agent-browser", installMethod: "npm", platforms: ["darwin", "linux", "win32"] };
const playwrightCli: CliTool = { name: "playwright-cli", command: "playwright-cli", installCmd: "npm install -g @playwright/cli@latest", installMethod: "npm", platforms: ["darwin", "linux", "win32"] };

// ── New Tools: System ──
const mcli: CliTool = { name: "m-cli", command: "m", installCmd: "brew install m-cli", installMethod: "brew", platforms: ["darwin"] };
const mas: CliTool = { name: "mas", command: "mas", installCmd: "brew install mas", installMethod: "brew", platforms: ["darwin"] };
const macosTrash: CliTool = { name: "macos-trash", command: "trash", installCmd: "brew install macos-trash", installMethod: "brew", platforms: ["darwin"] };
const brightness: CliTool = { name: "brightness", command: "brightness", installCmd: "brew install brightness", installMethod: "brew", platforms: ["darwin"] };

// ── New Tools: Scheduling ──
const lunchyGo: CliTool = { name: "lunchy-go", command: "lunchy-go", installCmd: "brew install lunchy-go", installMethod: "brew", platforms: ["darwin"] };

// ── New Tools: Files / Cloud ──
const rclone: CliTool = { name: "rclone", command: "rclone", installCmd: "brew install rclone", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };

// ── New Tools: Notifications ──
const terminalNotifier: CliTool = { name: "terminal-notifier", command: "terminal-notifier", installCmd: "brew install terminal-notifier", installMethod: "brew", platforms: ["darwin"] };

// ── New Tools: Networking ──
const doggo: CliTool = { name: "doggo", command: "doggo", installCmd: "brew install doggo", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };
const httpie: CliTool = { name: "httpie", command: "http", installCmd: "brew install httpie", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };

// ── New Tools: AI ──
const llmCli: CliTool = { name: "llm", command: "llm", installCmd: "brew install llm", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };
const aichat: CliTool = { name: "aichat", command: "aichat", installCmd: "brew install aichat", installMethod: "brew", platforms: ["darwin", "linux", "win32"] };

// ── Telegram & Discord (curl-based, no extra CLI tools) ──
const curl: CliTool = { name: "curl", command: "curl", installCmd: "brew install curl", installMethod: "builtin", platforms: ["darwin", "linux", "win32"] };

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
				{ label: "Apple Calendar (macOS)", value: "apple", tools: [icalBuddy] },
				{ label: "Both", value: "both", tools: [gogcli, icalBuddy] },
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
		id: "telegram",
		name: "Telegram Bridge",
		description: "Talk to Claude from your phone — full bidirectional Telegram bridge",
		category: "communication",
		tools: [],
		platforms: ["darwin", "linux", "win32"],
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

	// ── Automation ──
	{
		id: "briefing",
		name: "Daily Briefing",
		description: "Morning summary of email, calendar, tasks, and more",
		category: "automation",
		tools: [],
		platforms: ["darwin", "linux", "win32"],
		depends: ["email", "calendar"],
	},

	// ── Browser & Automation ──
	{
		id: "browser",
		name: "Browser",
		description: "Headless browser automation — navigate, click, fill forms, scrape",
		category: "automation",
		tools: [],
		platforms: ["darwin", "linux", "win32"],
		subChoices: {
			question: "Which browser engine?",
			options: [
				{ label: "Agent Browser (Vercel — built for AI)", value: "agent-browser", tools: [agentBrowser] },
				{ label: "Playwright CLI (Microsoft)", value: "playwright", tools: [playwrightCli] },
				{ label: "Both", value: "both", tools: [agentBrowser, playwrightCli] },
			],
		},
	},
	{
		id: "cron",
		name: "Scheduling / Cron",
		description: "Manage cron jobs and launchctl services on macOS",
		category: "automation",
		tools: [lunchyGo],
		platforms: ["darwin"],
	},

	// ── System ──
	{
		id: "system",
		name: "System Control",
		description: "macOS Swiss Army Knife — volume, wifi, battery, dock, trash",
		category: "system",
		tools: [mcli],
		platforms: ["darwin"],
	},
	{
		id: "apps",
		name: "App Store",
		description: "Install, update, search Mac App Store apps from CLI",
		category: "system",
		tools: [mas],
		platforms: ["darwin"],
	},
	{
		id: "files",
		name: "Cloud Files",
		description: "Sync files to Google Drive, S3, Dropbox, OneDrive, and 70+ providers",
		category: "system",
		tools: [rclone],
		platforms: ["darwin", "linux", "win32"],
		authSteps: [
			{ tool: "rclone", command: "rclone config", description: "Set up cloud storage remotes" },
		],
	},
	{
		id: "display",
		name: "Display & Brightness",
		description: "Get/set display brightness, safe trash instead of rm",
		category: "system",
		tools: [brightness, macosTrash],
		platforms: ["darwin"],
	},
	{
		id: "notify",
		name: "Notifications",
		description: "Send native macOS notifications from the terminal",
		category: "system",
		tools: [terminalNotifier],
		platforms: ["darwin"],
	},

	// ── Networking ──
	{
		id: "network",
		name: "Networking",
		description: "DNS lookups, HTTP client — readable API testing",
		category: "research",
		tools: [doggo, httpie],
		platforms: ["darwin", "linux", "win32"],
	},

	// ── AI Tools ──
	{
		id: "ai",
		name: "AI / LLM",
		description: "Query LLMs from CLI — pipe text, chat, summarize with local or cloud models",
		category: "research",
		tools: [],
		platforms: ["darwin", "linux", "win32"],
		subChoices: {
			question: "Which LLM CLI?",
			options: [
				{ label: "llm (Simon Willison — 100+ models)", value: "llm", tools: [llmCli] },
				{ label: "aichat (Rust — fast, multi-provider)", value: "aichat", tools: [aichat] },
				{ label: "Both", value: "both", tools: [llmCli, aichat] },
			],
		},
		authSteps: [
			{ tool: "llm", command: "llm keys set openai", description: "Set LLM API key" },
			{ tool: "aichat", command: "aichat (follow setup prompts)", description: "Configure API key" },
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
	automation: "Browser & Automation",
	system: "System & Files",
};

// ── Presets ──

export const presets: Preset[] = [
	{
		id: "everything",
		name: "Everything",
		description: "Install all skills available for your platform",
		skillIds: [],
	},
	{
		id: "essentials",
		name: "Essentials",
		description: "Email, calendar, notes, music, browser, system",
		skillIds: ["email", "calendar", "notes", "music", "browser", "system", "notify"],
	},
	{
		id: "productivity",
		name: "Productivity",
		description: "Notes, tasks, email, calendar, slack, files",
		skillIds: ["notes", "obsidian", "tasks", "email", "calendar", "slack", "files", "notify"],
	},
	{
		id: "developer",
		name: "Developer",
		description: "GitHub, Linear, Jira, browser, network, AI",
		skillIds: ["github", "linear", "jira", "browser", "network", "ai", "cron"],
	},
	{
		id: "creative",
		name: "Creative & Media",
		description: "Music, video, screen capture, voice, browser",
		skillIds: ["music", "video", "screen", "voice", "browser", "research"],
	},
	{
		id: "smart-home",
		name: "Smart Home",
		description: "Lights, speakers, bluetooth, system control",
		skillIds: ["lights", "speakers", "bluetooth", "system", "display", "notify"],
	},
];

export function getPresetSkills(presetId: string, platform: string): Skill[] {
	const preset = presets.find((p) => p.id === presetId);
	if (!preset) return [];
	const available = getSkillsForPlatform(platform);
	if (preset.id === "everything") return available;
	return available.filter((s) => preset.skillIds.includes(s.id));
}

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
