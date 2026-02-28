import * as p from "@clack/prompts";
import { showMini, accent, dim, bold } from "../core/branding.js";
import {
	readTelegramConfig,
	telegramConfigExists,
	telegramQuestionnaire,
	writeTelegramConfig,
	startTelegramBot,
} from "../core/telegram.js";

export async function telegramCommand(): Promise<void> {
	showMini();

	const config = readTelegramConfig();
	if (!config) {
		p.log.error("Telegram not configured yet.");
		p.log.info(`Run ${bold("openpaw telegram setup")} or ${bold("openpaw setup")} first.`);
		process.exit(1);
	}

	await startTelegramBot(config);
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
	p.log.success("Telegram config saved!");
	p.log.info(`Start the bridge with: ${bold("openpaw telegram")}`);
	p.outro(accent("Telegram setup complete 🐾"));
}
