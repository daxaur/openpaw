import chalk, { type ChalkInstance } from "chalk";

// ── Colors ──
const accent = chalk.hex("#30d2be");
const subtle = chalk.hex("#3584a7");
const dim = chalk.dim;
const bold = chalk.bold;
const pawClr = chalk.hex("#30d2be");

// ── Paw Art ──
// Graduated block art (▁▂▃▄▅▆▇█) — smooth anti-aliased edges, single color.

const PAW_ART = [
	"                ▁▁▁            ▁▁▁",
	"             ▂▄▅▆▆▆▅▄▂▁     ▂▄▅▆▆▆▅▄▂▁",
	"           ▁▃▆███████▆▃▁  ▁▃▆███████▆▃▁",
	"           ▁▃▇███████▇▄▁  ▁▃▇███████▇▄▁",
	"   ▁▂▃▄▄▄▂▁ ▁▂▅▆▇▇▇▆▅▃▁    ▁▂▅▆▇▇▇▆▅▃▁ ▁▂▃▄▄▄▂▁",
	"  ▂▅▇████▇▅▂   ▁▁▁▁▁          ▁▁▁▁▁   ▂▅▇████▇▅▃▁",
	" ▁▄▇██████▇▄▁                        ▁▄▇██████▇▄▁",
	"  ▂▄▇████▇▅▂                          ▂▄▇████▇▅▂",
	"    ▁▃▃▃▃▂▁                             ▁▃▃▃▃▂▁",
	"                      ▁▁▁▁▁▁",
	"                ▁▂▃▄▅▆▆▆▇▇▇▆▆▅▄▃▂▁",
	"              ▂▄▆▇██████████████▇▆▄▂",
	"            ▁▄▆████████████████████▇▄▂",
	"           ▂▅▇███████████████████████▅▂",
	"          ▁▄▇████████████████████████▇▄▁",
	"          ▁▅▇████████████████████████▇▅▂",
	"          ▁▃▆████████████████████████▇▄▁",
	"           ▁▄▆██████████████████████▇▄▁",
	"             ▂▅▇██████████████████▇▅▃▁",
	"               ▂▃▅▆▇██████████▇▇▅▄▂▁",
	"                  ▁▂▃▃▄▄▄▄▄▄▃▃▂▁",
];

const PAW_ROWS = PAW_ART.length;

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// ── Moods ──
export type PawMood = "wave" | "think" | "happy" | "work" | "done" | "warn";

const MOOD_HEX: Record<PawMood, string> = {
	wave: "#30d2be",
	think: "#30d2be",
	happy: "#30d2be",
	work: "#28b9a8",
	done: "#3ce6d2",
	warn: "#dca03c",
};

function pawColor(mood: PawMood): ChalkInstance {
	return chalk.hex(MOOD_HEX[mood]);
}

function renderPaw(color: ChalkInstance): string {
	return PAW_ART.map((line) => "  " + color(line)).join("\n");
}

// ── Public API ──

/**
 * Animated banner: fade in paw → pulse → title.
 */
export async function showBanner(): Promise<void> {
	process.stdout.write("\x1B[?25l"); // hide cursor

	// Fade in: dim → mid → full
	process.stdout.write(renderPaw(chalk.hex("#153d36")) + "\n");
	await sleep(60);

	process.stdout.write(`\x1B[${PAW_ROWS}A\x1B[J`);
	process.stdout.write(renderPaw(chalk.hex("#1f7a6d")) + "\n");
	await sleep(60);

	process.stdout.write(`\x1B[${PAW_ROWS}A\x1B[J`);
	process.stdout.write(renderPaw(pawClr) + "\n");
	await sleep(60);

	// Pulse: bright → settle
	process.stdout.write(`\x1B[${PAW_ROWS}A\x1B[J`);
	process.stdout.write(renderPaw(chalk.hex("#50f0da")) + "\n");
	await sleep(80);

	process.stdout.write(`\x1B[${PAW_ROWS}A\x1B[J`);
	process.stdout.write(renderPaw(pawClr) + "\n");

	process.stdout.write("\x1B[?25h"); // show cursor

	// Title
	console.log("");
	console.log(accent("  O P E N P A W"));
	console.log(dim("  Personal Assistant Wizard for Claude Code"));
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
	console.log(accent("  O P E N P A W"));
	console.log(dim("  Personal Assistant Wizard for Claude Code"));
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

export { accent, subtle, dim, bold };
