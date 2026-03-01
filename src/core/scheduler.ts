import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import { execSync } from "node:child_process";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type {
	ScheduledJob,
	ScheduleConfig,
	CostEntry,
	CostTracker,
	JobDelivery,
} from "../types.js";
import { readTelegramConfig } from "./telegram.js";

const CONFIG_DIR = path.join(os.homedir(), ".config", "openpaw");
const SCHEDULE_PATH = path.join(CONFIG_DIR, "schedules.json");
const COST_PATH = path.join(CONFIG_DIR, "schedule-costs.json");
const RESULTS_DIR = path.join(CONFIG_DIR, "schedule-results");
const LOGS_DIR = path.join(CONFIG_DIR, "logs");
const PLIST_DIR = path.join(os.homedir(), "Library", "LaunchAgents");

const MODEL_MAP: Record<string, string> = {
	sonnet: "claude-sonnet-4-5-20250514",
	opus: "claude-opus-4-6",
	haiku: "claude-haiku-4-5-20251001",
};

function ensureDirs(): void {
	for (const dir of [CONFIG_DIR, RESULTS_DIR, LOGS_DIR]) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

// ── Config I/O ──

export function readScheduleConfig(): ScheduleConfig {
	try {
		const raw = fs.readFileSync(SCHEDULE_PATH, "utf-8");
		return JSON.parse(raw) as ScheduleConfig;
	} catch {
		return { jobs: [], dailyCostCapUsd: 5, defaultModel: "sonnet" };
	}
}

export function writeScheduleConfig(config: ScheduleConfig): void {
	ensureDirs();
	fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(config, null, 2));
	fs.chmodSync(SCHEDULE_PATH, 0o600);
}

export function readCostTracker(): CostTracker {
	try {
		const raw = fs.readFileSync(COST_PATH, "utf-8");
		return JSON.parse(raw) as CostTracker;
	} catch {
		return { entries: [], dailyTotals: {} };
	}
}

function writeCostTracker(tracker: CostTracker): void {
	ensureDirs();
	fs.writeFileSync(COST_PATH, JSON.stringify(tracker, null, 2));
}

// ── Schedule Parsing ──

export function parseHumanSchedule(input: string): { cron: string; human: string } {
	const s = input.trim().toLowerCase();

	// Raw cron passthrough (5 fields)
	if (/^\S+\s+\S+\s+\S+\s+\S+\s+\S+$/.test(s) && /\d/.test(s)) {
		return { cron: s, human: `cron: ${s}` };
	}

	// Parse time from string like "8am", "9pm", "08:00", "21:30"
	const parseTime = (t: string): { hour: number; minute: number } | null => {
		const ampm = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
		if (ampm) {
			let hour = Number.parseInt(ampm[1], 10);
			const minute = ampm[2] ? Number.parseInt(ampm[2], 10) : 0;
			if (ampm[3] === "pm" && hour !== 12) hour += 12;
			if (ampm[3] === "am" && hour === 12) hour = 0;
			return { hour, minute };
		}
		const h24 = t.match(/^(\d{1,2}):(\d{2})$/);
		if (h24) {
			return { hour: Number.parseInt(h24[1], 10), minute: Number.parseInt(h24[2], 10) };
		}
		return null;
	};

	// "every N minutes"
	const everyMin = s.match(/^every\s+(\d+)\s+min(?:ute)?s?$/);
	if (everyMin) {
		const n = everyMin[1];
		return { cron: `*/${n} * * * *`, human: `every ${n} minutes` };
	}

	// "every N hours"
	const everyHr = s.match(/^every\s+(\d+)\s+hours?$/);
	if (everyHr) {
		const n = everyHr[1];
		return { cron: `0 */${n} * * *`, human: `every ${n} hours` };
	}

	// "daily TIME"
	const daily = s.match(/^daily\s+(.+)$/);
	if (daily) {
		const t = parseTime(daily[1]);
		if (t) return { cron: `${t.minute} ${t.hour} * * *`, human: `daily at ${daily[1]}` };
	}

	// "weekdays TIME"
	const weekdays = s.match(/^weekdays?\s+(.+)$/);
	if (weekdays) {
		const t = parseTime(weekdays[1]);
		if (t) return { cron: `${t.minute} ${t.hour} * * 1-5`, human: `weekdays at ${weekdays[1]}` };
	}

	// "weekends TIME"
	const weekends = s.match(/^weekends?\s+(.+)$/);
	if (weekends) {
		const t = parseTime(weekends[1]);
		if (t) return { cron: `${t.minute} ${t.hour} * * 0,6`, human: `weekends at ${weekends[1]}` };
	}

	// Specific day: "monday 9am", "sundays 10am"
	const dayMap: Record<string, string> = {
		sunday: "0", sundays: "0", sun: "0",
		monday: "1", mondays: "1", mon: "1",
		tuesday: "2", tuesdays: "2", tue: "2",
		wednesday: "3", wednesdays: "3", wed: "3",
		thursday: "4", thursdays: "4", thu: "4",
		friday: "5", fridays: "5", fri: "5",
		saturday: "6", saturdays: "6", sat: "6",
	};
	const dayMatch = s.match(/^(\w+)\s+(.+)$/);
	if (dayMatch && dayMap[dayMatch[1]]) {
		const t = parseTime(dayMatch[2]);
		if (t) {
			const dow = dayMap[dayMatch[1]];
			return { cron: `${t.minute} ${t.hour} * * ${dow}`, human: `${dayMatch[1]}s at ${dayMatch[2]}` };
		}
	}

	// Fallback — treat as raw cron or error
	return { cron: s, human: s };
}

// ── Job Management ──

export function addJob(
	opts: Omit<ScheduledJob, "id" | "createdAt">,
): ScheduledJob {
	const config = readScheduleConfig();
	const job: ScheduledJob = {
		...opts,
		id: crypto.randomUUID().slice(0, 8),
		createdAt: new Date().toISOString(),
	};
	config.jobs.push(job);
	writeScheduleConfig(config);
	return job;
}

export function removeJob(id: string): boolean {
	const config = readScheduleConfig();
	const idx = config.jobs.findIndex((j) => j.id === id);
	if (idx === -1) return false;
	config.jobs.splice(idx, 1);
	writeScheduleConfig(config);
	removeSystemJob(id);
	return true;
}

export function getJob(id: string): ScheduledJob | undefined {
	return readScheduleConfig().jobs.find((j) => j.id === id);
}

export function listJobs(): ScheduledJob[] {
	return readScheduleConfig().jobs;
}

export function toggleJob(id: string, enabled: boolean): boolean {
	const config = readScheduleConfig();
	const job = config.jobs.find((j) => j.id === id);
	if (!job) return false;
	job.enabled = enabled;
	writeScheduleConfig(config);

	if (enabled) {
		installSystemJob(job);
	} else {
		removeSystemJob(id);
	}
	return true;
}

// ── Cost Tracking ──

function todayStr(): string {
	return new Date().toISOString().slice(0, 10);
}

export function getTodaysCost(): number {
	const tracker = readCostTracker();
	return tracker.dailyTotals[todayStr()] || 0;
}

export function canRunWithinBudget(perRunBudget: number): boolean {
	const config = readScheduleConfig();
	return getTodaysCost() + perRunBudget <= config.dailyCostCapUsd;
}

export function recordCost(jobId: string, costUsd: number): void {
	const tracker = readCostTracker();
	const date = todayStr();
	tracker.entries.push({
		date,
		jobId,
		costUsd,
		timestamp: new Date().toISOString(),
	});
	tracker.dailyTotals[date] = (tracker.dailyTotals[date] || 0) + costUsd;

	// Prune entries older than 30 days
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - 30);
	const cutoffStr = cutoff.toISOString().slice(0, 10);
	tracker.entries = tracker.entries.filter((e) => e.date >= cutoffStr);
	for (const d of Object.keys(tracker.dailyTotals)) {
		if (d < cutoffStr) delete tracker.dailyTotals[d];
	}

	writeCostTracker(tracker);
}

// ── System Job Installation ──

function plistLabel(jobId: string): string {
	return `com.openpaw.schedule.${jobId}`;
}

function plistPath(jobId: string): string {
	return path.join(PLIST_DIR, `${plistLabel(jobId)}.plist`);
}

function resolveOpenpawBin(): string {
	try {
		return execSync("which openpaw", { encoding: "utf-8" }).trim();
	} catch {
		// Fallback to npx
		return "";
	}
}

function generatePlist(job: ScheduledJob): string {
	const [minute, hour, _dom, _month, dow] = job.schedule.split(" ");
	const openpawBin = resolveOpenpawBin();

	let programArgs: string;
	if (openpawBin) {
		programArgs = `    <string>${openpawBin}</string>\n    <string>schedule</string>\n    <string>run</string>\n    <string>${job.id}</string>`;
	} else {
		const npxPath = execSync("which npx", { encoding: "utf-8" }).trim();
		programArgs = `    <string>${npxPath}</string>\n    <string>openpaw</string>\n    <string>schedule</string>\n    <string>run</string>\n    <string>${job.id}</string>`;
	}

	// Build calendar interval entries
	let calendarInterval = "  <dict>\n";
	if (minute !== "*" && !minute.startsWith("*/")) {
		calendarInterval += `    <key>Minute</key>\n    <integer>${Number.parseInt(minute, 10)}</integer>\n`;
	}
	if (hour !== "*" && !hour.startsWith("*/")) {
		calendarInterval += `    <key>Hour</key>\n    <integer>${Number.parseInt(hour, 10)}</integer>\n`;
	}
	if (dow !== "*") {
		// Handle comma-separated days and ranges
		const days = dow.split(",");
		if (days.length === 1 && !dow.includes("-")) {
			calendarInterval += `    <key>Weekday</key>\n    <integer>${Number.parseInt(dow, 10)}</integer>\n`;
		}
	}
	calendarInterval += "  </dict>";

	// For interval-based schedules (*/N), use StartInterval instead
	const isInterval = minute.startsWith("*/") || hour.startsWith("*/");
	let intervalOrCalendar: string;
	if (isInterval) {
		let seconds = 0;
		if (minute.startsWith("*/")) {
			seconds = Number.parseInt(minute.slice(2), 10) * 60;
		} else if (hour.startsWith("*/")) {
			seconds = Number.parseInt(hour.slice(2), 10) * 3600;
		}
		intervalOrCalendar = `  <key>StartInterval</key>\n  <integer>${seconds}</integer>`;
	} else {
		// For weekday ranges like 1-5, create multiple calendar entries
		if (dow.includes("-")) {
			const [start, end] = dow.split("-").map(Number);
			const entries: string[] = [];
			for (let d = start; d <= end; d++) {
				let entry = "  <dict>\n";
				if (minute !== "*") entry += `    <key>Minute</key>\n    <integer>${Number.parseInt(minute, 10)}</integer>\n`;
				if (hour !== "*") entry += `    <key>Hour</key>\n    <integer>${Number.parseInt(hour, 10)}</integer>\n`;
				entry += `    <key>Weekday</key>\n    <integer>${d}</integer>\n`;
				entry += "  </dict>";
				entries.push(entry);
			}
			intervalOrCalendar = `  <key>StartCalendarInterval</key>\n  <array>\n${entries.join("\n")}\n  </array>`;
		} else {
			intervalOrCalendar = `  <key>StartCalendarInterval</key>\n${calendarInterval}`;
		}
	}

	const logPath = path.join(LOGS_DIR, `${job.id}.log`);
	const errPath = path.join(LOGS_DIR, `${job.id}.err`);

	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${plistLabel(job.id)}</string>
  <key>ProgramArguments</key>
  <array>
${programArgs}
  </array>
${intervalOrCalendar}
  <key>StandardOutPath</key>
  <string>${logPath}</string>
  <key>StandardErrorPath</key>
  <string>${errPath}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${path.join(os.homedir(), ".npm-global", "bin")}</string>
    <key>HOME</key>
    <string>${os.homedir()}</string>
  </dict>
</dict>
</plist>`;
}

export function installSystemJob(job: ScheduledJob): boolean {
	ensureDirs();

	if (process.platform === "darwin") {
		try {
			fs.mkdirSync(PLIST_DIR, { recursive: true });
			const plist = generatePlist(job);
			const p = plistPath(job.id);
			// Unload first if exists
			try {
				execSync(`launchctl unload "${p}" 2>/dev/null`, { stdio: "ignore" });
			} catch { /* ignore */ }
			fs.writeFileSync(p, plist);
			execSync(`launchctl load "${p}"`);
			return true;
		} catch {
			return false;
		}
	}

	// Linux — crontab
	try {
		const openpawBin = resolveOpenpawBin() || "npx openpaw";
		const line = `${job.schedule} ${openpawBin} schedule run ${job.id} >> ${LOGS_DIR}/${job.id}.log 2>&1 # openpaw:${job.id}`;
		const existing = execSync("crontab -l 2>/dev/null || true", { encoding: "utf-8" });
		const filtered = existing.split("\n").filter((l) => !l.includes(`openpaw:${job.id}`));
		filtered.push(line);
		const content = filtered.filter(Boolean).join("\n") + "\n";
		execSync(`echo '${content.replace(/'/g, "'\\''")}' | crontab -`);
		return true;
	} catch {
		return false;
	}
}

export function removeSystemJob(jobId: string): boolean {
	if (process.platform === "darwin") {
		const p = plistPath(jobId);
		try {
			execSync(`launchctl unload "${p}" 2>/dev/null`, { stdio: "ignore" });
		} catch { /* ignore */ }
		try {
			fs.unlinkSync(p);
		} catch { /* ignore */ }
		return true;
	}

	// Linux — crontab
	try {
		const existing = execSync("crontab -l 2>/dev/null || true", { encoding: "utf-8" });
		const filtered = existing.split("\n").filter((l) => !l.includes(`openpaw:${jobId}`));
		const content = filtered.filter(Boolean).join("\n") + "\n";
		execSync(`echo '${content.replace(/'/g, "'\\''")}' | crontab -`);
		return true;
	} catch {
		return false;
	}
}

// ── Job Execution ──

async function deliverResult(job: ScheduledJob, text: string): Promise<void> {
	const delivery = job.delivery;
	const truncated = text.length > 4000 ? `${text.slice(0, 4000)}...` : text;

	if (delivery.type === "telegram") {
		const tgConfig = readTelegramConfig();
		if (tgConfig) {
			const header = `*[${job.name}]*\n\n`;
			const body = header + truncated;
			for (const userId of tgConfig.allowedUserIds) {
				try {
					await fetch(`https://api.telegram.org/bot${tgConfig.botToken}/sendMessage`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							chat_id: userId,
							text: body,
							parse_mode: "Markdown",
						}),
					});
				} catch {
					// Telegram delivery failed — fall through to file
				}
			}
		}
	}

	if (delivery.type === "notify") {
		try {
			const title = `OpenPaw: ${job.name}`;
			const msg = truncated.slice(0, 200);
			execSync(`terminal-notifier -title "${title}" -message "${msg.replace(/"/g, '\\"')}"`, { stdio: "ignore" });
		} catch {
			// terminal-notifier not installed
		}
	}

	// Always save to file as backup
	ensureDirs();
	const ts = new Date().toISOString().replace(/[:.]/g, "-");
	const resultPath = path.join(RESULTS_DIR, `${job.id}-${ts}.md`);
	fs.writeFileSync(resultPath, `# ${job.name}\n\n**Run:** ${new Date().toISOString()}\n**Model:** ${job.model}\n\n---\n\n${text}`);
}

export async function runJob(
	jobId: string,
): Promise<{ success: boolean; result?: string; costUsd?: number; error?: string }> {
	const job = getJob(jobId);
	if (!job) {
		return { success: false, error: `Job ${jobId} not found` };
	}

	if (!job.enabled) {
		return { success: false, error: `Job ${jobId} is disabled` };
	}

	if (!canRunWithinBudget(job.maxBudgetUsd)) {
		// Update job status
		const config = readScheduleConfig();
		const j = config.jobs.find((x) => x.id === jobId);
		if (j) {
			j.lastRunAt = new Date().toISOString();
			j.lastRunResult = "budget_exceeded";
			writeScheduleConfig(config);
		}
		return { success: false, error: "Daily cost cap exceeded" };
	}

	let fullText = "";
	let costUsd = 0;

	try {
		const modelId = MODEL_MAP[job.model] || MODEL_MAP.sonnet;
		const q = query({
			prompt: job.prompt,
			options: {
				model: modelId,
				permissionMode: "bypassPermissions",
				allowDangerouslySkipPermissions: true,
				cwd: os.homedir(),
				maxTurns: 25,
			},
		});

		for await (const message of q) {
			if (message.type === "assistant") {
				const msgContent = (message as { message: { content: Array<{ type: string; text?: string }> } }).message;
				const text = msgContent.content
					.filter((block: { type: string }) => block.type === "text")
					.map((block: { text?: string }) => block.text || "")
					.join("");
				if (text) fullText = text;
			}

			if (message.type === "result") {
				const result = message as { result?: string; cost_usd?: number };
				if (result.result) fullText = result.result;
				if (result.cost_usd) costUsd = result.cost_usd;
			}
		}

		// Record cost (estimate if SDK didn't provide)
		if (costUsd === 0) {
			// Rough estimate: ~$0.003 per 1K chars for sonnet
			costUsd = Math.max(0.01, (fullText.length / 1000) * 0.003);
		}
		recordCost(jobId, costUsd);

		// Deliver
		await deliverResult(job, fullText || "Job completed with no output.");

		// Update job status
		const config = readScheduleConfig();
		const j = config.jobs.find((x) => x.id === jobId);
		if (j) {
			j.lastRunAt = new Date().toISOString();
			j.lastRunCostUsd = costUsd;
			j.lastRunResult = "success";
			writeScheduleConfig(config);
		}

		return { success: true, result: fullText, costUsd };
	} catch (err: unknown) {
		const errorMsg = err instanceof Error ? err.message : "Unknown error";

		// Record a minimal cost for the failed attempt
		recordCost(jobId, 0.01);

		const config = readScheduleConfig();
		const j = config.jobs.find((x) => x.id === jobId);
		if (j) {
			j.lastRunAt = new Date().toISOString();
			j.lastRunResult = "error";
			writeScheduleConfig(config);
		}

		return { success: false, error: errorMsg };
	}
}
