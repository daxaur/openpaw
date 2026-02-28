import chalk from "chalk";
import gradient from "gradient-string";
import * as readline from "node:readline";

// ── Color Palette (Poimandres-inspired — used by create-t3-app) ──
const brand = gradient(["#add7ff", "#89ddff", "#5de4c7", "#fae4fc", "#d0679d"]);
const accent = chalk.hex("#89ddff");
const subtle = chalk.hex("#5de4c7");
const dim = chalk.dim;
const bold = chalk.bold;

// ── Paw Art — Block Elements with 3D depth (░▓█) ──
// Design: top-left light source, ░ = highlight, ▓ = shadow, █ = fill
// Compact, no wasted space, instantly recognizable paw print

const PAW_CENTER = [
	"      ░██▓ ░██▓",
	"      ░██▓ ░██▓",
	"    ░██▓    ░██▓",
	"    ░██▓    ░██▓",
	"      ░██████▓",
	"    ░██████████▓",
	"    ░██████████▓",
	"     ▓████████▓",
	"      ▓▓▓▓▓▓▓▓",
];

const PAW_LEFT = [
	"    ░██▓ ░██▓",
	"    ░██▓ ░██▓",
	"  ░██▓    ░██▓",
	"  ░██▓    ░██▓",
	"    ░██████▓",
	"  ░██████████▓",
	"  ░██████████▓",
	"   ▓████████▓",
	"    ▓▓▓▓▓▓▓▓",
];

const PAW_RIGHT = [
	"        ░██▓ ░██▓",
	"        ░██▓ ░██▓",
	"      ░██▓    ░██▓",
	"      ░██▓    ░██▓",
	"        ░██████▓",
	"      ░██████████▓",
	"      ░██████████▓",
	"       ▓████████▓",
	"        ▓▓▓▓▓▓▓▓",
];

// Different paw "moods" for wizard steps
const PAW_WAVE = [
	"      ░██▓ ░██▓    ~",
	"      ░██▓ ░██▓   ~",
	"    ░██▓    ░██▓  ~",
	"    ░██▓    ░██▓",
	"      ░██████▓",
	"    ░██████████▓",
	"    ░██████████▓",
	"     ▓████████▓",
	"      ▓▓▓▓▓▓▓▓",
];

const PAW_SPARKLE = [
	"    ✦ ░██▓ ░██▓ ✦",
	"      ░██▓ ░██▓",
	"  ✦ ░██▓    ░██▓",
	"    ░██▓    ░██▓ ✦",
	"      ░██████▓",
	"    ░██████████▓",
	"    ░██████████▓",
	"     ▓████████▓",
	"      ▓▓▓▓▓▓▓▓",
];

const PAW_PULSE = [
	"      ▓██▓ ▓██▓",
	"      ████ ████",
	"    ▓██▓    ▓██▓",
	"    ████    ████",
	"      ████████",
	"    ████████████",
	"    ████████████",
	"    ████████████",
	"      ████████",
];

const PAW_MINI = [
	"   ██ ██",
	"  ██   ██",
	"   █████",
	"  ███████",
	"  ███████",
	"   █████",
	"    ███",
];

// ── Paw moods for wizard steps ──
export type PawMood = "wave" | "think" | "happy" | "work" | "done" | "warn";

const MOOD_CONFIG: Record<PawMood, { art: string[]; label: string }> = {
	wave: { art: PAW_WAVE, label: "Hey there!" },
	think: { art: PAW_LEFT, label: "Hmm..." },
	happy: { art: PAW_SPARKLE, label: "Nice!" },
	work: { art: PAW_PULSE, label: "Installing..." },
	done: { art: PAW_SPARKLE, label: "All done!" },
	warn: { art: PAW_RIGHT, label: "Heads up" },
};

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

function renderPaw(lines: string[]): string {
	return brand.multiline(lines.join("\n"));
}

/**
 * Animated banner — toes appear, palm draws in, then interactive arrow-key phase.
 */
export async function showBanner(): Promise<void> {
	process.stdout.write("\x1B[2J\x1B[H"); // clear
	process.stdout.write("\x1B[?25l"); // hide cursor

	const artHeight = PAW_CENTER.length;

	// Phase 1: Draw toes one by one
	const canvas: string[] = Array(artHeight).fill("");

	// Top inner toes (rows 0-1)
	canvas[0] = PAW_CENTER[0];
	canvas[1] = PAW_CENTER[1];
	process.stdout.write("\x1B[H");
	console.log(renderPaw(canvas));
	await sleep(120);

	// Bottom outer toes (rows 2-3)
	canvas[2] = PAW_CENTER[2];
	canvas[3] = PAW_CENTER[3];
	process.stdout.write("\x1B[H");
	console.log(renderPaw(canvas));
	await sleep(120);

	// Palm rows one at a time
	for (let i = 4; i < artHeight; i++) {
		canvas[i] = PAW_CENTER[i];
		process.stdout.write("\x1B[H");
		console.log(renderPaw(canvas));
		await sleep(60);
	}

	// Phase 2: Pulse
	for (let p = 0; p < 2; p++) {
		process.stdout.write("\x1B[H");
		console.log(renderPaw(p % 2 === 0 ? PAW_PULSE : PAW_CENTER));
		await sleep(100);
	}
	process.stdout.write("\x1B[H");
	console.log(renderPaw(PAW_CENTER));

	process.stdout.write("\x1B[?25h"); // show cursor

	// Phase 3: Brief arrow-key reactive phase (1.5s)
	await interactivePawPhase(1500, artHeight);

	// Title box
	console.log("");
	console.log(accent("  ┌───────────────────────────────┐"));
	console.log(accent("  │") + bold.white("    O P E N P A W   v0.1.0     ") + accent("│"));
	console.log(accent("  └───────────────────────────────┘"));
	console.log(dim("  Personal Assistant Wizard for Claude Code"));
	console.log("");
}

/**
 * Arrow-key reactive phase — paw tilts left/right based on arrow presses.
 */
async function interactivePawPhase(durationMs: number, artHeight: number): Promise<void> {
	return new Promise<void>((resolve) => {
		let current = "center";

		readline.emitKeypressEvents(process.stdin);
		if (process.stdin.isTTY) {
			process.stdin.setRawMode(true);
		}
		process.stdin.resume();

		const redraw = (art: string[]) => {
			process.stdout.write(`\x1B[${artHeight}A`); // move up
			process.stdout.write("\x1B[J"); // clear down
			console.log(renderPaw(art));
		};

		const handler = (_str: string | undefined, key: readline.Key) => {
			if (!key) return;
			if (key.name === "left" && current !== "left") {
				current = "left";
				redraw(PAW_LEFT);
			} else if (key.name === "right" && current !== "right") {
				current = "right";
				redraw(PAW_RIGHT);
			} else if (key.name === "return" || key.name === "space") {
				cleanup();
			}
		};

		const cleanup = () => {
			process.stdin.removeListener("keypress", handler);
			if (process.stdin.isTTY) {
				process.stdin.setRawMode(false);
			}
			process.stdin.pause();

			// Settle to center
			if (current !== "center") {
				redraw(PAW_CENTER);
			}
			resolve();
		};

		process.stdin.on("keypress", handler);
		setTimeout(cleanup, durationMs);
	});
}

/**
 * Show a mood-specific paw between wizard steps.
 * Renders the paw art + a label, then clears it for the next prompt.
 */
export async function pawStep(mood: PawMood, message?: string): Promise<void> {
	const config = MOOD_CONFIG[mood];
	const text = message ?? config.label;

	console.log("");
	console.log(renderPaw(config.art));
	console.log(`  ${subtle(text)}`);
	await sleep(600);

	// Clear the paw (move up and erase)
	const lineCount = config.art.length + 2; // art + blank + text
	process.stdout.write(`\x1B[${lineCount}A`);
	process.stdout.write("\x1B[J");
}

/**
 * Quick inline paw pulse — for lightweight transitions.
 */
export async function pawPulse(mood: PawMood, message?: string): Promise<void> {
	const config = MOOD_CONFIG[mood];
	const text = message ?? config.label;
	const line = `  ${subtle("◉")} ${accent(text)}`;

	for (let i = 0; i < 3; i++) {
		if (i > 0) process.stdout.write("\x1B[1A");
		const style = i % 2 === 0 ? bold : dim;
		process.stdout.write(`\x1B[2K${style(line)}\n`);
		await sleep(80);
	}
	process.stdout.write("\x1B[1A");
	process.stdout.write(`\x1B[2K${line}\n`);
}

/**
 * Static banner — no animation.
 */
export function showBannerStatic(): void {
	console.log(renderPaw(PAW_MINI));
	console.log("");
	console.log(accent("  ┌───────────────────────────────┐"));
	console.log(accent("  │") + bold.white("    O P E N P A W   v0.1.0     ") + accent("│"));
	console.log(accent("  └───────────────────────────────┘"));
	console.log("");
}

/**
 * One-line mini brand.
 */
export function showMini(): void {
	console.log(subtle("  ◉ openpaw") + dim(" — Personal Assistant Wizard for Claude Code"));
}

export { brand, accent, subtle, dim, bold };
