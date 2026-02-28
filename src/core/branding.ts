import chalk from "chalk";
import gradient from "gradient-string";

// ── Color Palette ──
// Stripe-inspired indigo/violet — clean on dark and light terminals
const brand = gradient(["#7c3aed", "#a78bfa", "#c4b5fd"]);
const accent = chalk.hex("#a78bfa");
const dim = chalk.dim;
const bold = chalk.bold;

// ── Paw Layers ──
// Dense Braille stamp — high-fidelity paw with proper oval toes + tapered palm

// 4 toe layers + 1 palm layer for toe-by-toe reveal animation
const TOE_TOP_RIGHT = [
	"                   ⢀⣴⣦⡀",
	"                  ⢸⣿⣿⣿⡇",
	"                   ⠙⠿⠋  ",
];

const TOE_TOP_LEFT = [
	"          ⢀⣴⣦⡀        ",
	"         ⢸⣿⣿⣿⡇       ",
	"          ⠙⠿⠋         ",
];

const TOE_BOT_RIGHT = [
	"                        ⢀⣴⣦⡀",
	"                       ⢸⣿⣿⣿⡇",
	"                        ⠙⠿⠋  ",
];

const TOE_BOT_LEFT = [
	"       ⢀⣴⣦⡀              ",
	"      ⢸⣿⣿⣿⡇             ",
	"       ⠙⠿⠋               ",
];

const PALM = [
	"            ⣀⣤⣶⣶⣤⣀    ",
	"          ⣴⣿⣿⣿⣿⣿⣿⣿⣦  ",
	"         ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿ ",
	"        ⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇",
	"         ⠘⢿⣿⣿⣿⣿⣿⣿⣿⡿⠃ ",
	"           ⠈⠛⢿⣿⣿⡿⠛⠁  ",
];

// Full assembled paw — all layers combined
const PAW_FULL = `
          ⢀⣴⣦⡀    ⢀⣴⣦⡀
         ⢸⣿⣿⣿⡇  ⢸⣿⣿⣿⡇
          ⠙⠿⠋    ⠙⠿⠋
       ⢀⣴⣦⡀          ⢀⣴⣦⡀
      ⢸⣿⣿⣿⡇        ⢸⣿⣿⣿⡇
       ⠙⠿⠋            ⠙⠿⠋
            ⣀⣤⣶⣶⣤⣀
          ⣴⣿⣿⣿⣿⣿⣿⣿⣦
         ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
        ⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
         ⠘⢿⣿⣿⣿⣿⣿⣿⣿⡿⠃
           ⠈⠛⢿⣿⣿⡿⠛⠁`;

const PAW_COMPACT = `
        ⣴⣷   ⣴⣷
        ⠻⠟   ⠻⠟
     ⣴⣷         ⣴⣷
     ⠻⠟         ⠻⠟
        ⣠⣶⣶⣶⣄
      ⣰⣿⣿⣿⣿⣿⣿⣦
      ⣿⣿⣿⣿⣿⣿⣿⣿⣿
       ⠻⣿⣿⣿⣿⣿⣿⠟
         ⠙⠿⣿⠿⠋`;

// ── Paw moods for wizard steps ──
export type PawMood = "wave" | "think" | "happy" | "work" | "done" | "warn";

const PAW_MOODS: Record<PawMood, { emoji: string; text: string }> = {
	wave: { emoji: "🐾", text: "Hey there!" },
	think: { emoji: "🤔", text: "Hmm, let me think..." },
	happy: { emoji: "✨", text: "Nice choice!" },
	work: { emoji: "⚡", text: "On it..." },
	done: { emoji: "🎉", text: "All done!" },
	warn: { emoji: "⚠️", text: "Heads up!" },
};

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * Merge a layer onto a canvas of lines.
 * Each layer line overwrites non-space characters onto the canvas.
 */
function mergeLayer(canvas: string[], layer: string[], startRow: number): void {
	for (let i = 0; i < layer.length; i++) {
		const row = startRow + i;
		if (row >= canvas.length) continue;
		const canvasChars = [...canvas[row]];
		const layerChars = [...layer[i]];
		for (let j = 0; j < layerChars.length; j++) {
			if (layerChars[j] !== " " && j < canvasChars.length) {
				canvasChars[j] = layerChars[j];
			}
		}
		canvas[row] = canvasChars.join("");
	}
}

/**
 * Animated banner — toes appear one by one, then palm draws in.
 */
export async function showBanner(): Promise<void> {
	const totalRows = 14;
	const emptyCanvas = (): string[] => Array(totalRows).fill(" ".repeat(35));

	process.stdout.write("\x1B[2J\x1B[H"); // clear screen
	process.stdout.write("\x1B[?25l"); // hide cursor

	// Frame 1: top-left toe
	let canvas = emptyCanvas();
	mergeLayer(canvas, TOE_TOP_LEFT, 1);
	process.stdout.write("\x1B[H");
	console.log(brand.multiline(canvas.join("\n")));
	await sleep(150);

	// Frame 2: + top-right toe
	mergeLayer(canvas, TOE_TOP_RIGHT, 1);
	process.stdout.write("\x1B[H");
	console.log(brand.multiline(canvas.join("\n")));
	await sleep(150);

	// Frame 3: + bottom-left toe
	mergeLayer(canvas, TOE_BOT_LEFT, 4);
	process.stdout.write("\x1B[H");
	console.log(brand.multiline(canvas.join("\n")));
	await sleep(150);

	// Frame 4: + bottom-right toe
	mergeLayer(canvas, TOE_BOT_RIGHT, 4);
	process.stdout.write("\x1B[H");
	console.log(brand.multiline(canvas.join("\n")));
	await sleep(150);

	// Frames 5-7: palm draws in row by row
	for (let r = 0; r < PALM.length; r++) {
		mergeLayer(canvas, [PALM[r]], 8 + r);
		process.stdout.write("\x1B[H");
		console.log(brand.multiline(canvas.join("\n")));
		await sleep(80);
	}

	// Pulse: bright → normal → bright → settle
	for (let p = 0; p < 3; p++) {
		process.stdout.write("\x1B[H");
		const style = p % 2 === 0 ? chalk.bold : (s: string) => s;
		const rendered = brand.multiline(canvas.join("\n"));
		console.log(rendered.split("\n").map((l) => style(l)).join("\n"));
		await sleep(100);
	}

	// Final render
	process.stdout.write("\x1B[H");
	console.log(brand.multiline(canvas.join("\n")));

	process.stdout.write("\x1B[?25h"); // show cursor

	console.log("");
	console.log(accent("   ┌─────────────────────────────────┐"));
	console.log(accent("   │") + bold.white("     O P E N P A W   v0.1.0      ") + accent("│"));
	console.log(accent("   └─────────────────────────────────┘"));
	console.log("");
	console.log(dim("   Personal Assistant Wizard for Claude Code"));
	console.log("");
}

/**
 * Animate a paw pulse — bold/dim flicker effect for between wizard steps.
 */
export async function pawPulse(mood: PawMood, message?: string): Promise<void> {
	const m = PAW_MOODS[mood];
	const text = message ?? m.text;
	const line = `  ${m.emoji} ${accent(text)}`;

	for (let i = 0; i < 4; i++) {
		if (i > 0) {
			process.stdout.write("\x1B[1A"); // cursor up 1
		}
		const style = i % 2 === 0 ? bold : dim;
		process.stdout.write(`\x1B[2K${style(line)}\n`);
		await sleep(100);
	}
	process.stdout.write("\x1B[1A");
	process.stdout.write(`\x1B[2K${line}\n`);
}

/**
 * Static banner — no animation, for non-interactive contexts.
 */
export function showBannerStatic(): void {
	console.log(brand.multiline(PAW_COMPACT));
	console.log("");
	console.log(accent("   ┌─────────────────────────────────┐"));
	console.log(accent("   │") + bold.white("     O P E N P A W   v0.1.0      ") + accent("│"));
	console.log(accent("   └─────────────────────────────────┘"));
	console.log("");
}

/**
 * One-line mini brand for subcommands.
 */
export function showMini(): void {
	console.log(accent("  ⬤ openpaw") + dim(" — Personal Assistant Wizard for Claude Code"));
}

export { brand, accent, dim, bold };
