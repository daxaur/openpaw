import chalk, { type ChalkInstance } from "chalk";

// ── Colors ──
const accent = chalk.hex("#b4783c");
const subtle = chalk.hex("#8a5a2a");
const dim = chalk.dim;
const bold = chalk.bold;
const pawClr = chalk.hex("#b4783c");

// ── Paw Art ──
// Graduated block art (▁▂▃▄▅▆▇█) — single brown color.

const PAW_ART = [
	"                                            ▃▅",
	"                                           ▁██▁               ▄█▁",
	"                                       ▁▁▂▆▇██▃               ▅█▆",
	"                                      ▅▆█▇▆▄███▆▂         ▁▂▆▇██▇▅▁",
	"                                    ▁▃█▆▁   ▄███▄▁       ▆▇▇▅▄▄███▇▃▁",
	"                                   ▁▃█▄     ▁████▂     ▁▅█▃   ▁▃████▂",
	"                                   ▄█▇▁     ▂████▄▁   ▁▃█▇     ▁████▅▂",
	"                                   ▅█▆      ▂█████▁   ▄█▇▁      ▂████▃",
	"                        ▂▁         ▆█▆      ▂█████▁   ▄█▇      ▁▂████▂",
	"                      ▁▅█▂         ▆█▆▁   ▁▃▇████▆▁   ▄█▇     ▂▄█████▂",
	"                      ▁██▄▂        ▂██▇▆▃▄▇██████     ▄██▄▇▇▃▃▆█████▁",
	"                     ▂█████▇▅▂▁    ▁▄▇█████████▆▂     ▃▇████████████▁        ▁▂▁",
	"                    ▄█▇▃  ▁███▆▁     ▁▃▆▇▇▇▇▃▄▂        ▂▆█████████▅         ▁▇█▂",
	"                   ▃▆▄▁    ▅███▆▃                         ▄▄▅▅▅▅▂▁       ▂▄▃▄██▂",
	"                   ▆█▄     ▃████▄           ▁▄▄██████▄▃▃▂            ▁▂▆▇▇▆████▇▁",
	"                   ▆█▄      ▂████▄        ▂▅▇▇▅▅▁▃▅█▇████▆▂         ▅▇▇▅▄▁ ▂▆████▂",
	"                   ▇█▄      ▅████▄        ▇█▄     ▁▃▇▆████▇▂      ▂▃█▇▃ ▁    ▃███▂",
	"                   ▇██▅   ▂▆████▄▁       ▆█▄▁ ▁    ▅▄▅█████▅      ▆█▆▂      ▃▆███▁",
	"                   ▁████████████▃       ▂▇▆▂         ▄█████▆     ▃██▂      ▂▆███▆",
	"                    ▃█████████▅▂        ██▂          ▄█████▆     ▅██▁     ▁████▇",
	"                      ▂▄▄▄▄▄▄          ▇█▃▁         ▁▅█████▅     ▃██▄▇▆▁▁▄▇████▆",
	"                                   ▁▁▁▇█▂▁ ▁        ▄██████▆▂     ▇███████████▅▁",
	"                               ▁▁▄▅▆██▅▂  ▁▁        ▄███████▄      ▄▅██████▆▅▂",
	"                              ▄██▆▅▄▂▁  ▁           ▃▆██████▇▄▂      ▁▁▁▁▁▁▁",
	"                            ▂██▄▁▁                   ▁▄▅██████▇▆▂▁",
	"                           ▃▇▇▂    ▁▁                  ▁ ▃▇██████▇▃▁",
	"                          ▁▄█▆   ▁                        ▁▆█▇█████▆▂",
	"                          ▄██▇                             ▃▅███████▅▁",
	"                          ▄██▇▁       ▂▂▂▁▁▂▆▇▇▇▇▇▃▁       ▄▆▄▂▇█████▃",
	"                          ▃▇██▇▃   ▁▂▆▆██▆▇█████████▆▄▁▁  ▁▁▁▄▇██████▃",
	"                           ▄█████▆▆▇███████████████████▆▃▁ ▁▄▇███████▃",
	"                           ▁▅█████████████████████████████▅█████████▄▁",
	"                            ▁▂▆█████████████████████████████████████▂",
	"                              ▁▂▆▆▆▆▆▆▃▂▂▂▂▂▂▂▂▂▂▂▂▂▅▆███████████▇▆▁",
	"                                                      ▃▃▇▇▇▇▇▇▇▃▃",
];

const PAW_ROWS = PAW_ART.length;

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// ── Box renderer ──

function renderBox(title: string, subtitle: string): string {
	const boxW = 48;
	const center = (s: string, w: number) => {
		const pad = w - s.length;
		const left = Math.floor(pad / 2);
		return " ".repeat(left) + s + " ".repeat(pad - left);
	};
	const margin = "               ";
	const lines = [
		pawClr(margin + "┌" + "─".repeat(boxW) + "┐"),
		pawClr(margin + "│" + " ".repeat(boxW) + "│"),
		pawClr(margin + "│" + center(title, boxW) + "│"),
		dim(margin + "│" + center(subtitle, boxW) + "│"),
		pawClr(margin + "│" + " ".repeat(boxW) + "│"),
		pawClr(margin + "└" + "─".repeat(boxW) + "┘"),
	];
	return lines.join("\n");
}

// ── Moods ──
export type PawMood = "wave" | "think" | "happy" | "work" | "done" | "warn";

const MOOD_HEX: Record<PawMood, string> = {
	wave: "#b4783c",
	think: "#b4783c",
	happy: "#b4783c",
	work: "#9a6832",
	done: "#c88a48",
	warn: "#dca03c",
};

function pawColor(mood: PawMood): ChalkInstance {
	return chalk.hex(MOOD_HEX[mood]);
}

function renderPaw(color: ChalkInstance): string {
	return PAW_ART.map((line) => color(line)).join("\n");
}

// ── Public API ──

/**
 * Banner: brown paw + title box.
 */
export async function showBanner(): Promise<void> {
	console.log(renderPaw(pawClr));
	console.log("");
	console.log(renderBox("O P E N P A W", "Personal Assistant Wizard for Claude Code"));
	console.log("");
}

/**
 * Show paw between wizard steps — mood-colored, brief flash, then clears.
 */
export async function pawStep(
	mood: PawMood,
	message?: string,
): Promise<void> {
	const color = pawColor(mood);
	process.stdout.write(renderPaw(color) + "\n");
	if (message) console.log(`  ${accent(message)}`);
	await sleep(300);

	const lines = PAW_ROWS + (message ? 1 : 0);
	process.stdout.write(`\x1B[${lines}A\x1B[J`);
}

/**
 * Inline pulse indicator for quick transitions.
 */
export async function pawPulse(
	mood: PawMood,
	message?: string,
): Promise<void> {
	if (!message) return;
	const line = `  ${accent("◉")} ${subtle(message)}`;

	for (let i = 0; i < 3; i++) {
		if (i > 0) process.stdout.write("\x1B[1A");
		const s = i % 2 === 0 ? bold : dim;
		process.stdout.write(`\x1B[2K${s(line)}\n`);
		await sleep(80);
	}
	process.stdout.write(`\x1B[1A\x1B[2K${line}\n`);
}

/**
 * Static banner — no animation.
 */
export function showBannerStatic(): void {
	console.log(renderPaw(pawClr));
	console.log("");
	console.log(renderBox("O P E N P A W", "Personal Assistant Wizard for Claude Code"));
	console.log("");
}

/**
 * Mini one-liner.
 */
export function showMini(): void {
	console.log(
		accent("  ◉ openpaw") +
			dim(" — Personal Assistant Wizard for Claude Code"),
	);
}

/**
 * Puppy disclaimer about --dangerously-skip-permissions.
 */
export function showPuppyDisclaimer(): void {
	console.log("");
	console.log(pawClr("     /\\_/\\"));
	console.log(pawClr("    ( o.o )") + `   ${bold("WOOF! One important sniff...")}`);
	console.log(pawClr("     > ^ <"));
	console.log("");
	console.log(`  ${accent("You're about to let Claude off the leash!")}`);
	console.log(dim("  (--dangerously-skip-permissions)"));
	console.log("");
	console.log("  This lets Claude run commands without asking each time.");
	console.log("  It's how your assistant actually gets things done —");
	console.log("  checking email, playing music, managing files.");
	console.log("");
	console.log(dim("  OpenPaw's safety hooks still block the dangerous stuff"));
	console.log(dim("  (mass deletes, credential leaks, etc)."));
	console.log("");
	console.log(dim("  You can always run 'claude' normally without this."));
	console.log("");
}

export { accent, subtle, dim, bold };
