import * as p from "@clack/prompts";
import { showMini, accent, dim } from "../core/branding.js";
import { soulQuestionnaire, writeSoul, showSoulSummary, soulExists } from "../core/soul.js";

export async function soulCommand(): Promise<void> {
	showMini();
	p.intro(accent(" openpaw soul "));

	if (soulExists()) {
		p.log.info(dim("SOUL.md already exists at ~/.claude/SOUL.md"));
		const overwrite = await p.confirm({
			message: "Overwrite existing personality?",
			initialValue: false,
		});

		if (p.isCancel(overwrite) || !overwrite) {
			p.log.info("Keeping existing SOUL.md");
			p.outro(accent("Done"));
			return;
		}
	}

	const soul = await soulQuestionnaire();
	if (!soul) {
		p.cancel("Cancelled.");
		return;
	}

	writeSoul(soul);
	showSoulSummary(soul);
	p.log.success("Personality saved to ~/.claude/SOUL.md");
	p.outro(accent("Claude will use this personality next session 🐾"));
}
