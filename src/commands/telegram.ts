import { execSync } from "node:child_process";
import * as p from "@clack/prompts";
import { accent, bold, dim, showMini } from "../core/branding.js";
import {
	ensureTelegramReady,
	telegramConfigExists,
	telegramQuestionnaire,
	writeTelegramConfig,
} from "../core/telegram.js";

export async function telegramCommand(): Promise<void> {
	showMini();

	if (!telegramConfigExists()) {
		p.log.error("Telegram not configured yet.");
		p.log.info(
			`Run ${bold("openpaw telegram setup")} or ${bold("openpaw setup")} first.`,
		);
		process.exit(1);
	}

	const status = ensureTelegramReady();
	if (!status.ok) {
		p.log.error(status.message);
		process.exit(1);
	}

	// The official plugin runs the bridge as a channel inside Claude Code, so
	// "starting" the bridge means launching Claude Code with the plugin enabled.
	p.log.success(status.message);
	p.log.info(
		dim(
			"Launching Claude Code — message your bot on Telegram to talk to it. (Ctrl+C to stop)",
		),
	);
	try {
		execSync("claude", { stdio: "inherit" });
	} catch {
		p.log.warn(
			"Couldn't launch Claude Code automatically. Start it yourself with: claude",
		);
	}
}

export async function telegramSetupCommand(): Promise<void> {
	showMini();
	p.intro(accent(" Telegram Bridge Setup "));

	if (telegramConfigExists()) {
		const overwrite = await p.confirm({
			message: "Telegram is already configured. Reconfigure?",
			initialValue: false,
		});
		if (p.isCancel(overwrite) || !overwrite) {
			p.outro("Keeping existing config. 🐾");
			return;
		}
	}

	const config = await telegramQuestionnaire();
	if (!config) {
		p.cancel("Setup cancelled.");
		process.exit(0);
	}

	writeTelegramConfig(config);
	p.log.success("Telegram config saved (official plugin)!");

	const status = ensureTelegramReady();
	if (status.ok) p.log.success(status.message);
	else p.log.warn(status.message);

	p.log.info(`Start the bridge with: ${bold("openpaw telegram")}`);
	p.outro(accent("Telegram setup complete 🐾"));
}
