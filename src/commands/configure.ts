import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import { showMini, accent, dim } from "../core/branding.js";

export async function configureCommand(): Promise<void> {
	showMini();
	console.log("");

	const action = await p.select({
		message: "What would you like to configure?",
		options: [
			{ value: "add", label: "Add more skills", hint: "install new capabilities" },
			{ value: "remove", label: "Remove skills", hint: "uninstall capabilities" },
			{ value: "soul", label: "Edit personality", hint: "name, tone, verbosity" },
			{ value: "dashboard", label: "Open dashboard", hint: "task manager in browser" },
			{ value: "telegram", label: "Telegram setup", hint: "configure bot bridge" },
			{ value: "schedule", label: "Manage schedules", hint: "recurring tasks + cost control" },
			{ value: "status", label: "View status", hint: "see what's installed" },
			{ value: "doctor", label: "Run diagnostics", hint: "check for issues" },
		],
	});

	if (p.isCancel(action)) {
		p.outro(dim("Come back anytime!"));
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
