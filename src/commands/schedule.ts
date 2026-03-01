import * as p from "@clack/prompts";
import chalk from "chalk";
import { showMini, accent, dim, bold } from "../core/branding.js";
import {
	readScheduleConfig,
	addJob,
	removeJob,
	listJobs,
	runJob,
	toggleJob,
	parseHumanSchedule,
	getTodaysCost,
	readCostTracker,
	installSystemJob,
} from "../core/scheduler.js";
import { telegramConfigExists } from "../core/telegram.js";

export async function scheduleAddCommand(
	schedule: string | undefined,
	opts: { run?: string; model?: string; budget?: string; delivery?: string },
): Promise<void> {
	showMini();
	console.log("");

	let scheduleStr: string;
	let prompt: string;
	let model: string;
	let budgetUsd: number;
	let deliveryType: "telegram" | "file" | "notify";

	if (opts.run && schedule) {
		// Inline mode
		scheduleStr = schedule;
		prompt = opts.run;
		model = opts.model || "sonnet";
		budgetUsd = opts.budget ? Number.parseFloat(opts.budget) : 1.0;
		deliveryType = (opts.delivery as "telegram" | "file" | "notify") || "file";
	} else {
		// Interactive mode
		p.intro(accent("Let's schedule a new job! 🐾"));

		const schedInput = await p.text({
			message: "When should this run?",
			placeholder: 'e.g. "weekdays 8am", "daily 9pm", "every 30 minutes"',
			validate: (v) => (v.length === 0 ? "Schedule is required" : undefined),
		});
		if (p.isCancel(schedInput)) return;
		scheduleStr = schedInput as string;

		const promptInput = await p.text({
			message: "What should Claude do?",
			placeholder: "e.g. check my email and summarize the important ones",
			validate: (v) => (v.length === 0 ? "Prompt is required" : undefined),
		});
		if (p.isCancel(promptInput)) return;
		prompt = promptInput as string;

		const deliveryOptions: { value: string; label: string; hint?: string }[] = [
			{ value: "file", label: "Save to file", hint: "~/.config/openpaw/schedule-results/" },
		];
		if (telegramConfigExists()) {
			deliveryOptions.unshift({ value: "telegram", label: "Telegram", hint: "send to your phone" });
		}
		deliveryOptions.push({ value: "notify", label: "macOS Notification", hint: "requires terminal-notifier" });

		const deliveryChoice = await p.select({
			message: "Where should results be delivered?",
			options: deliveryOptions,
		});
		if (p.isCancel(deliveryChoice)) return;
		deliveryType = deliveryChoice as "telegram" | "file" | "notify";

		const modelChoice = await p.select({
			message: "Which model?",
			options: [
				{ value: "sonnet", label: "Sonnet", hint: "fast, good for routine tasks ($)" },
				{ value: "haiku", label: "Haiku", hint: "fastest, cheapest (¢)" },
				{ value: "opus", label: "Opus", hint: "most capable, expensive ($$$)" },
			],
		});
		if (p.isCancel(modelChoice)) return;
		model = modelChoice as string;

		const budgetInput = await p.text({
			message: "Per-run budget cap (USD)?",
			placeholder: "1.00",
			defaultValue: "1.00",
			validate: (v) => {
				const n = Number.parseFloat(v);
				if (Number.isNaN(n) || n <= 0) return "Must be a positive number";
				return undefined;
			},
		});
		if (p.isCancel(budgetInput)) return;
		budgetUsd = Number.parseFloat(budgetInput as string);
	}

	const parsed = parseHumanSchedule(scheduleStr);

	const job = addJob({
		name: prompt.slice(0, 60),
		prompt,
		schedule: parsed.cron,
		scheduleHuman: parsed.human,
		enabled: true,
		model,
		maxBudgetUsd: budgetUsd,
		delivery: { type: deliveryType },
	});

	const installed = installSystemJob(job);

	console.log("");
	p.log.success(`Job created: ${accent(job.id)}`);
	p.log.info(`  Schedule: ${bold(parsed.human)} (${dim(parsed.cron)})`);
	p.log.info(`  Prompt:   ${dim(prompt.slice(0, 80))}`);
	p.log.info(`  Model:    ${model}`);
	p.log.info(`  Budget:   $${budgetUsd.toFixed(2)}/run`);
	p.log.info(`  Delivery: ${deliveryType}`);

	if (installed) {
		p.log.success(
			process.platform === "darwin"
				? "Registered with launchd (runs even when terminal is closed)"
				: "Added to crontab",
		);
	} else {
		p.log.warn("Could not register system job. Run manually with: openpaw schedule run " + job.id);
	}

	console.log("");
	p.log.info(dim(`Test it now: ${accent("openpaw schedule run " + job.id)}`));
}

export async function scheduleListCommand(): Promise<void> {
	showMini();
	console.log("");

	const jobs = listJobs();
	if (jobs.length === 0) {
		p.log.info("No scheduled jobs yet. Create one with:");
		p.log.info(accent('  openpaw schedule add "weekdays 8am" --run "check email"'));
		return;
	}

	const config = readScheduleConfig();
	const todayCost = getTodaysCost();

	console.log(
		`  ${bold("Scheduled Jobs")} ${dim(`(daily cap: $${config.dailyCostCapUsd.toFixed(2)}, today: $${todayCost.toFixed(2)})`)}`,
	);
	console.log("");

	for (const job of jobs) {
		const status = job.enabled ? chalk.green("ON ") : chalk.red("OFF");
		const lastRun = job.lastRunAt
			? dim(` last: ${new Date(job.lastRunAt).toLocaleDateString()} ${job.lastRunResult || ""}`)
			: "";
		const cost = job.lastRunCostUsd ? dim(` $${job.lastRunCostUsd.toFixed(3)}`) : "";

		console.log(`  ${status} ${accent(job.id)} ${bold(job.scheduleHuman)}`);
		console.log(`      ${dim(job.prompt.slice(0, 70))}${lastRun}${cost}`);
		console.log(`      ${dim(`model: ${job.model} | budget: $${job.maxBudgetUsd.toFixed(2)} | delivery: ${job.delivery.type}`)}`);
		console.log("");
	}
}

export async function scheduleRemoveCommand(id: string): Promise<void> {
	showMini();
	console.log("");

	if (!id) {
		p.log.error("Usage: openpaw schedule remove <id>");
		return;
	}

	const removed = removeJob(id);
	if (removed) {
		p.log.success(`Job ${accent(id)} removed and unregistered from system scheduler.`);
	} else {
		p.log.error(`Job ${id} not found.`);
	}
}

export async function scheduleRunCommand(id: string): Promise<void> {
	if (!id) {
		p.log.error("Usage: openpaw schedule run <id>");
		return;
	}

	// When called from launchd, keep output minimal
	const isInteractive = process.stdout.isTTY;
	if (isInteractive) {
		showMini();
		console.log("");
		const s = p.spinner();
		s.start(`Running job ${accent(id)}...`);

		const result = await runJob(id);

		if (result.success) {
			s.stop(`Job completed! Cost: $${(result.costUsd || 0).toFixed(3)}`);
			if (result.result) {
				console.log("");
				console.log(dim("  ─── Result ───"));
				console.log("");
				const lines = result.result.split("\n").slice(0, 20);
				for (const line of lines) {
					console.log(`  ${line}`);
				}
				if (result.result.split("\n").length > 20) {
					console.log(dim("  ... (truncated)"));
				}
			}
		} else {
			s.stop(`Job failed: ${result.error}`);
		}
	} else {
		// Non-interactive (launchd/cron) — just run quietly
		const result = await runJob(id);
		if (!result.success) {
			console.error(`[openpaw] Job ${id} failed: ${result.error}`);
			process.exit(1);
		}
	}
}

export async function scheduleToggleCommand(id: string, enabled: boolean): Promise<void> {
	showMini();
	console.log("");

	if (!id) {
		p.log.error(`Usage: openpaw schedule ${enabled ? "enable" : "disable"} <id>`);
		return;
	}

	const ok = toggleJob(id, enabled);
	if (ok) {
		p.log.success(`Job ${accent(id)} ${enabled ? "enabled" : "disabled"}.`);
	} else {
		p.log.error(`Job ${id} not found.`);
	}
}

export async function scheduleCostsCommand(): Promise<void> {
	showMini();
	console.log("");

	const config = readScheduleConfig();
	const tracker = readCostTracker();
	const todayCost = getTodaysCost();
	const cap = config.dailyCostCapUsd;
	const pct = cap > 0 ? Math.round((todayCost / cap) * 100) : 0;

	console.log(`  ${bold("Cost Tracker")}`);
	console.log("");
	console.log(`  Today:     ${accent(`$${todayCost.toFixed(3)}`)} / $${cap.toFixed(2)} (${pct}%)`);
	console.log("");

	// Last 7 days
	const days = Object.entries(tracker.dailyTotals)
		.sort(([a], [b]) => b.localeCompare(a))
		.slice(0, 7);

	if (days.length > 0) {
		console.log(`  ${dim("Recent days:")}`);
		for (const [date, cost] of days) {
			const bar = "█".repeat(Math.ceil((cost / cap) * 20));
			console.log(`  ${dim(date)}  $${cost.toFixed(3)}  ${accent(bar)}`);
		}
	}

	console.log("");

	// Today's entries
	const todayStr = new Date().toISOString().slice(0, 10);
	const todayEntries = tracker.entries.filter((e) => e.date === todayStr);
	if (todayEntries.length > 0) {
		console.log(`  ${dim("Today's runs:")}`);
		for (const entry of todayEntries) {
			const time = new Date(entry.timestamp).toLocaleTimeString();
			console.log(`  ${dim(time)}  ${entry.jobId}  $${entry.costUsd.toFixed(3)}`);
		}
	}

	console.log("");
	p.log.info(dim(`Daily cap: openpaw schedule set-cap <usd>`));
}

export async function scheduleSetCapCommand(amount: string): Promise<void> {
	showMini();
	console.log("");

	const usd = Number.parseFloat(amount);
	if (Number.isNaN(usd) || usd <= 0) {
		p.log.error("Amount must be a positive number (e.g. 5.00)");
		return;
	}

	const config = readScheduleConfig();
	config.dailyCostCapUsd = usd;
	const { writeScheduleConfig } = await import("../core/scheduler.js");
	writeScheduleConfig(config);

	p.log.success(`Daily cost cap set to ${accent(`$${usd.toFixed(2)}`)}`);
}
