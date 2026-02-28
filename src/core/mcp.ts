import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { readSettings, writeSettings } from "./permissions.js";

export interface McpServer {
	id: string;
	name: string;
	description: string;
	command: string;
	args: string[];
	env?: Record<string, string>;
	envPlaceholders?: Record<string, string>;
	installCmd?: string;
	category: string;
}

// ── MCP Server Catalog ──

export const mcpServers: McpServer[] = [
	{
		id: "filesystem",
		name: "Filesystem",
		description: "Read, write, search, and manage files with advanced operations",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-filesystem", os.homedir()],
		category: "system",
	},
	{
		id: "fetch",
		name: "Fetch",
		description: "Fetch and convert web content to markdown for analysis",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-fetch"],
		category: "research",
	},
	{
		id: "memory",
		name: "Memory (KG)",
		description: "Persistent knowledge graph memory — entities, relations, observations",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-memory"],
		category: "productivity",
	},
	{
		id: "github",
		name: "GitHub",
		description: "Repos, PRs, issues, branches, file operations via GitHub API",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-github"],
		env: { GITHUB_PERSONAL_ACCESS_TOKEN: "" },
		envPlaceholders: { GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_your_token_here" },
		category: "developer",
	},
	{
		id: "slack",
		name: "Slack",
		description: "Read/send Slack messages, manage channels, users, reactions",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-slack"],
		env: { SLACK_BOT_TOKEN: "", SLACK_TEAM_ID: "" },
		envPlaceholders: { SLACK_BOT_TOKEN: "xoxb-your-token", SLACK_TEAM_ID: "T00000000" },
		category: "communication",
	},
	{
		id: "google-drive",
		name: "Google Drive",
		description: "Search and read Google Drive files, Docs, Sheets",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-gdrive"],
		category: "productivity",
	},
	{
		id: "postgres",
		name: "PostgreSQL",
		description: "Query PostgreSQL databases with read-only access",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-postgres"],
		env: { POSTGRES_CONNECTION_STRING: "" },
		envPlaceholders: { POSTGRES_CONNECTION_STRING: "postgresql://user:pass@localhost/db" },
		category: "developer",
	},
	{
		id: "brave-search",
		name: "Brave Search",
		description: "Web and local search using Brave Search API",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-brave-search"],
		env: { BRAVE_API_KEY: "" },
		envPlaceholders: { BRAVE_API_KEY: "your_api_key" },
		category: "research",
	},
	{
		id: "puppeteer",
		name: "Puppeteer",
		description: "Browser automation — navigate, screenshot, interact with web pages",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-puppeteer"],
		category: "automation",
	},
	{
		id: "sequential-thinking",
		name: "Sequential Thinking",
		description: "Step-by-step reasoning and problem-solving tool",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
		category: "research",
	},
];

export function getInstalledMcpServers(): string[] {
	const settings = readSettings();
	const mcpSection = settings.mcpServers as Record<string, unknown> | undefined;
	if (!mcpSection) return [];
	return Object.keys(mcpSection);
}

export function installMcpServer(server: McpServer, envValues?: Record<string, string>): boolean {
	const settings = readSettings();

	if (!settings.mcpServers) {
		settings.mcpServers = {};
	}

	const mcpSection = settings.mcpServers as Record<string, unknown>;
	const config: Record<string, unknown> = {
		command: server.command,
		args: server.args,
	};

	if (server.env) {
		const env: Record<string, string> = {};
		for (const [key, defaultVal] of Object.entries(server.env)) {
			env[key] = envValues?.[key] ?? defaultVal;
		}
		config.env = env;
	}

	mcpSection[server.id] = config;
	writeSettings(settings);
	return true;
}

export function removeMcpServer(serverId: string): boolean {
	const settings = readSettings();
	const mcpSection = settings.mcpServers as Record<string, unknown> | undefined;
	if (!mcpSection || !(serverId in mcpSection)) return false;

	delete mcpSection[serverId];
	writeSettings(settings);
	return true;
}

export function getMcpServersByCategory(): Map<string, McpServer[]> {
	const grouped = new Map<string, McpServer[]>();
	for (const server of mcpServers) {
		const existing = grouped.get(server.category) ?? [];
		existing.push(server);
		grouped.set(server.category, existing);
	}
	return grouped;
}
