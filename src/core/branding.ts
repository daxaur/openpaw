import chalk from "chalk";
import gradient from "gradient-string";
import * as readline from "node:readline";

// ── Colors ──
const brand = gradient.mind; // deep purple #473b7b → blue #3584a7 → teal #30d2be
const glow = gradient.vice; // teal #5ee7df → lavender #b490ca
const accent = chalk.hex("#30d2be");
const subtle = chalk.hex("#3584a7");
const dim = chalk.dim;
const bold = chalk.bold;

// ── Paw Print Art ──
// Half-block capsule technique: ▄ = top round, ▀ = bottom round
// 4 oval toe beans + tapered palm pad. Instantly recognizable.

const PAW = [
	"    ▄██▄ ▄██▄",
	"    ▀██▀ ▀██▀",
	"  ▄██▄     ▄██▄",
	"  ▀██▀     ▀██▀",
	"     ▄██████▄",
	"   ▄██████████▄",
	"   ██████████████",
	"   ▀██████████▀",
	"     ▀██████▀",
];

const PAW_LEFT = [
	"  ▄██▄ ▄██▄",
	"  ▀██▀ ▀██▀",
	"▄██▄     ▄██▄",
	"▀██▀     ▀██▀",
	"   ▄██████▄",
	" ▄██████████▄",
	" ██████████████",
	" ▀██████████▀",
	"   ▀██████▀",
];

const PAW_RIGHT = [
	"      ▄██▄ ▄██▄",
	"      ▀██▀ ▀██▀",
	"    ▄██▄     ▄██▄",
	"    ▀██▀     ▀██▀",
	"       ▄██████▄",
	"     ▄██████████▄",
	"     ██████████████",
	"     ▀██████████▀",
	"       ▀██████▀",
];

// Sparkle paw — shown after selection / on success
const PAW_SPARKLE = [
	"  ✦ ▄██▄ ▄██▄ ✦",
	"    ▀██▀ ▀██▀",
	"  ▄██▄     ▄██▄",
	"  ▀██▀     ▀██▀  ✦",
	"     ▄██████▄",
	"   ▄██████████▄",
	" ✦ ██████████████",
	"   ▀██████████▀",
	"     ▀██████▀",
];

// Press/stamp paw — shown during installation (bolder)
const PAW_STAMP = [
	"    ████ ████",
	"    ████ ████",
	"  ████     ████",
	"  ████     ████",
	"     ████████",
	"   ████████████",
	"   ████████████",
	"   ████████████",
	"     ████████",
];

// Mini paw for subcommands
const PAW_TINY = [
	"  ▄█▄ ▄█▄",
	"  ▀█▀ ▀█▀",
	" ▄█▄   ▄█▄",
	" ▀█▀   ▀█▀",
	"   ▄████▄",
	"  ████████",
	"  ▀██████▀",
];

// ── Paw step moods ──
export type PawMood = "wave" | "think" | "happy" | "work" | "done" | "warn";

const MOOD_ART: Record<PawMood, string[]> = {
	wave: PAW,
	think: PAW_LEFT,
	happy: PAW_SPARKLE,
	work: PAW_STAMP,
	done: PAW_SPARKLE,
	warn: PAW_RIGHT,
};

const MOOD_LABEL: Record<PawMood, string> = {
	wave: "",
	think: "",
	happy: "",
	work: "",
	done: "",
	warn: "",
};

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

function render(art: string[]): string {
	return brand.multiline(art.join("\n"));
}

/**
 * Animated banner with color sweep + arrow-key reactivity.
 */
export async function showBanner(): Promise<void> {
	process.stdout.write("\x1B[2J\x1B[H");
	process.stdout.write("\x1B[?25l"); // hide cursor

	const h = PAW.length;

	// Phase 1: Color sweep — reveal paw line by line with gradient
	for (let i = 0; i < h; i++) {
		const partial = PAW.slice(0, i + 1);
		// Pad with empty lines so cursor position stays consistent
		const padded = [...partial, ...Array(h - partial.length).fill("")];
		process.stdout.write("\x1B[H");
		console.log(render(padded));
		await sleep(50);
	}

	// Phase 2: Pulse — flash bright then settle
	for (let p = 0; p < 3; p++) {
		process.stdout.write("\x1B[H");
		const art = p % 2 === 0 ? PAW_STAMP : PAW;
		console.log(render(art));
		await sleep(80);
	}
	process.stdout.write("\x1B[H");
	console.log(render(PAW));

	process.stdout.write("\x1B[?25h"); // show cursor

	// Phase 3: Arrow-key reactive (1.5s)
	await interactivePaw(1500, h);

	// Title
	console.log(accent("  ┌───────────────────────────────┐"));
	console.log(accent("  │") + bold.white("    O P E N P A W   v0.1.0     ") + accent("│"));
	console.log(accent("  └───────────────────────────────┘"));
	console.log(dim("  Personal Assistant Wizard for Claude Code"));
	console.log("");
}

/**
 * Arrow-key reactive phase — paw tilts with left/right arrows.
 */
async function interactivePaw(ms: number, height: number): Promise<void> {
	return new Promise<void>((resolve) => {
		let pos = "center";

		readline.emitKeypressEvents(process.stdin);
		if (process.stdin.isTTY) process.stdin.setRawMode(true);
		process.stdin.resume();

		const draw = (art: string[]) => {
			process.stdout.write(`\x1B[${height}A\x1B[J`);
			console.log(render(art));
		};

		const onKey = (_s: string | undefined, key: readline.Key) => {
			if (!key) return;
			if (key.name === "left" && pos !== "left") {
				pos = "left";
				draw(PAW_LEFT);
			} else if (key.name === "right" && pos !== "right") {
				pos = "right";
				draw(PAW_RIGHT);
			} else if (key.name === "return" || key.name === "space") {
				done();
			}
		};

		const done = () => {
			process.stdin.removeListener("keypress", onKey);
			if (process.stdin.isTTY) process.stdin.setRawMode(false);
			process.stdin.pause();
			if (pos !== "center") draw(PAW);
			resolve();
		};

		process.stdin.on("keypress", onKey);
		setTimeout(done, ms);
	});
}

/**
 * Show full paw art between wizard steps — renders then clears.
 */
export async function pawStep(mood: PawMood, message?: string): Promise<void> {
	const art = MOOD_ART[mood];
	const text = message;

	console.log("");
	console.log(render(art));
	if (text) console.log(`  ${accent(text)}`);
	await sleep(500);

	// Clear
	const lines = art.length + (text ? 2 : 1);
	process.stdout.write(`\x1B[${lines}A\x1B[J`);
}

/**
 * Inline pulse for quick transitions.
 */
export async function pawPulse(mood: PawMood, message?: string): Promise<void> {
	const text = message ?? MOOD_LABEL[mood];
	if (!text) return;
	const line = `  ${accent("◉")} ${subtle(text)}`;

	for (let i = 0; i < 3; i++) {
		if (i > 0) process.stdout.write("\x1B[1A");
		const s = i % 2 === 0 ? bold : dim;
		process.stdout.write(`\x1B[2K${s(line)}\n`);
		await sleep(80);
	}
	process.stdout.write("\x1B[1A\x1B[2K" + line + "\n");
}

/**
 * Static banner — no animation.
 */
export function showBannerStatic(): void {
	console.log(render(PAW_TINY));
	console.log("");
	console.log(accent("  ┌───────────────────────────────┐"));
	console.log(accent("  │") + bold.white("    O P E N P A W   v0.1.0     ") + accent("│"));
	console.log(accent("  └───────────────────────────────┘"));
	console.log("");
}

/**
 * Mini one-liner.
 */
export function showMini(): void {
	console.log(accent("  ◉ openpaw") + dim(" — Personal Assistant Wizard for Claude Code"));
}

export { brand, glow, accent, subtle, dim, bold };
