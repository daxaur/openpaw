import * as p from "@clack/prompts";
import chalk from "chalk";
import { execSync } from "node:child_process";
import { showMini, accent, dim, bold } from "../core/branding.js";
import { readTelegramConfig, writeTelegramConfig, telegramConfigExists } from "../core/telegram.js";
import { readScheduleConfig, writeScheduleConfig } from "../core/scheduler.js";
import { regenerateClaudeMd } from "../core/claude-md.js";

export async function configureCommand(): Promise<void> {
	showMini();
	console.log("");

	const action = await p.select({
		message: "What would you like to configure?",
		options: [
			{ value: "add", label: "Add more skills", hint: "install new capabilities" },
			{ value: "remove", label: "Remove skills", hint: "uninstall capabilities" },
			{ value: "theme", label: "Paw style Claude Code", hint: "patch Claude Code UI with OpenPaw styling" },
			{ value: "model", label: "Model preferences", hint: "default model for Telegram + scheduling" },
			{ value: "soul", label: "Edit personality", hint: "name, tone, verbosity" },
			{ value: "dashboard", label: "Open dashboard", hint: "task manager in browser" },
			{ value: "telegram", label: "Telegram setup", hint: "configure bot bridge" },
			{ value: "lockin setup", label: "Lock In Mode", hint: "block distractions, set the mood" },
			{ value: "schedule", label: "Manage schedules", hint: "recurring tasks + cost control" },
			{ value: "status", label: "View status", hint: "see what's installed" },
			{ value: "doctor", label: "Run diagnostics", hint: "check for issues" },
		],
	});

	if (p.isCancel(action)) {
		p.outro(dim("Come back anytime!"));
		return;
	}

	// Model preferences handled inline
	if (action === "model") {
		await modelPreferences();
		return;
	}

	const cmd = `openpaw ${action as string}`;
	console.log("");
	p.log.info(`Running ${accent(cmd)}...`);
	console.log("");

	try {
		execSync(`node ${process.argv[1]} ${action as string}`, {
			stdio: "inherit",
			cwd: process.cwd(),
		});
	} catch {
		// Command handles its own errors
	}
}

async function modelPreferences(): Promise<void> {
	console.log("");

	const hasTelegram = telegramConfigExists();
	let hasScheduling = false;
	try {
		const schedConfig = readScheduleConfig();
		hasScheduling = schedConfig.dailyCostCapUsd > 0 || schedConfig.jobs.length > 0;
	} catch {}

	if (!hasTelegram && !hasScheduling) {
		p.log.info("No Telegram or scheduling configured yet — model preferences apply to those features.");
		p.log.info(`Run ${bold("openpaw telegram setup")} or enable scheduling in the wizard.`);
		return;
	}

	// Show current state
	const lines: string[] = [];
	if (hasTelegram) {
		const tgConfig = readTelegramConfig();
		lines.push(`${bold("Telegram:")}    ${tgConfig?.model || "sonnet"}`);
	}
	if (hasScheduling) {
		const schedConfig = readScheduleConfig();
		lines.push(`${bold("Scheduling:")}  ${schedConfig.defaultModel || "sonnet"}`);
		lines.push(`${bold("Cost cap:")}    $${schedConfig.dailyCostCapUsd}/day`);
	}
	p.note(lines.join("\n"), "Current Model Settings");

	// Telegram model
	if (hasTelegram) {
		const tgConfig = readTelegramConfig()!;
		const newModel = await p.select({
			message: "Default model for Telegram",
			options: [
				{ value: "sonnet", label: "Sonnet", hint: `fast + capable${tgConfig.model === "sonnet" ? " (current)" : ""}` },
				{ value: "haiku", label: "Haiku", hint: `cheapest${tgConfig.model === "haiku" ? " (current)" : ""}` },
				{ value: "opus", label: "Opus", hint: `most capable${tgConfig.model === "opus" ? " (current)" : ""}` },
			],
		});

		if (!p.isCancel(newModel) && newModel !== tgConfig.model) {
			tgConfig.model = newModel as string;
			writeTelegramConfig(tgConfig);
			p.log.success(`Telegram model → ${accent(newModel as string)}`);
		}
	}

	// Schedule model + cap
	if (hasScheduling) {
		const schedConfig = readScheduleConfig();

		const newModel = await p.select({
			message: "Default model for scheduled jobs",
			options: [
				{ value: "sonnet", label: "Sonnet", hint: `fast + capable${schedConfig.defaultModel === "sonnet" ? " (current)" : ""}` },
				{ value: "haiku", label: "Haiku", hint: `cheapest${schedConfig.defaultModel === "haiku" ? " (current)" : ""}` },
				{ value: "opus", label: "Opus", hint: `most capable${schedConfig.defaultModel === "opus" ? " (current)" : ""}` },
			],
		});

		if (!p.isCancel(newModel) && newModel !== schedConfig.defaultModel) {
			schedConfig.defaultModel = newModel as string;
			writeScheduleConfig(schedConfig);
			p.log.success(`Schedule default model → ${accent(newModel as string)}`);
		}

		const newCap = await p.text({
			message: "Daily cost cap in USD",
			initialValue: String(schedConfig.dailyCostCapUsd),
			validate: (v) => {
				const n = Number.parseFloat(v);
				return Number.isNaN(n) || n <= 0 ? "Enter a valid dollar amount" : undefined;
			},
		});

		if (!p.isCancel(newCap)) {
			const cap = Number.parseFloat(newCap as string);
			if (cap !== schedConfig.dailyCostCapUsd) {
				schedConfig.dailyCostCapUsd = cap;
				writeScheduleConfig(schedConfig);
				p.log.success(`Daily cap → ${accent("$" + cap)}`);
			}
		}
	}

	regenerateClaudeMd();
	p.outro(dim("Model preferences updated"));
}
