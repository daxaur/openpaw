import chalk from "chalk";
import gradient from "gradient-string";
import * as readline from "node:readline";

// ── Colors ──
const brand = gradient.mind;
const glow = gradient.vice;
const accent = chalk.hex("#30d2be");
const subtle = chalk.hex("#3584a7");
const dim = chalk.dim;
const bold = chalk.bold;

// ── Truecolor Paw Engine ──
// Procedural 3D paw using half-block pixel art (▀ with fg+bg truecolor).
// Monochrome — one base color, 3D depth from shading only.

type RGB = [number, number, number];

interface Pad {
	cx: number;
	cy: number;
	rx: number;
	ry: number;
}

const W = 29;
const H = 20;
const PAW_ROWS = H / 2; // 10 output character rows

// Pad layout — 4 toes in arc + 1 palm
const BASE_PADS: Pad[] = [
	{ cx: 10.5, cy: 1.5, rx: 2.8, ry: 2.5 },
	{ cx: 18.5, cy: 1.5, rx: 2.8, ry: 2.5 },
	{ cx: 5, cy: 5, rx: 2.5, ry: 2.5 },
	{ cx: 24, cy: 5, rx: 2.5, ry: 2.5 },
	{ cx: 14.5, cy: 14, rx: 7, ry: 5.5 },
];

// ── Moods ──
export type PawMood = "wave" | "think" | "happy" | "work" | "done" | "warn";

// Monochrome palettes — single base color per mood
const MOOD_COLORS: Record<PawMood, RGB> = {
	wave: [48, 210, 190],
	think: [48, 210, 190],
	happy: [48, 210, 190],
	work: [40, 185, 168],
	done: [60, 230, 210],
	warn: [220, 160, 60],
};

function clamp(v: number): number {
	return Math.min(255, Math.max(0, Math.round(v)));
}

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// ── Pixel grid generation ──

function generatePaw(
	base: RGB,
	brightness = 1.0,
	offsetX = 0,
): (RGB | null)[][] {
	const pads =
		offsetX === 0
			? BASE_PADS
			: BASE_PADS.map((p) => ({ ...p, cx: p.cx + offsetX }));

	const grid: (RGB | null)[][] = [];
	for (let y = 0; y < H; y++) {
		grid[y] = [];
		for (let x = 0; x < W; x++) {
			grid[y][x] = null;
			for (const pad of pads) {
				const dx = (x - pad.cx) / pad.rx;
				const dy = (y - pad.cy) / pad.ry;
				const dist = Math.sqrt(dx * dx + dy * dy);

				let alpha: number;
				if (dist <= 0.82) alpha = 1.0;
				else if (dist <= 1.0) alpha = 1.0 - (dist - 0.82) / 0.18;
				else continue;

				// 3D: edge darkening + directional light + specular
				const edge = 1.0 - dist * 0.2;
				const light = 1.0 + -dx * 0.12 + -dy * 0.12;
				const specD = Math.sqrt((dx + 0.3) ** 2 + (dy + 0.35) ** 2);
				const spec = Math.max(0, 1.0 - specD * 1.1) * 0.2 * 255;

				const shade = Math.max(0.25, edge * light) * alpha * brightness;
				grid[y][x] = [
					clamp(base[0] * shade + spec * alpha * brightness),
					clamp(base[1] * shade + spec * alpha * brightness),
					clamp(base[2] * shade + spec * alpha * brightness),
				];
				break;
			}
		}
	}
	return grid;
}

// ── Half-block renderer ──

function renderPaw(grid: (RGB | null)[][], margin = "  "): string {
	const lines: string[] = [];
	for (let y = 0; y < grid.length; y += 2) {
		let line = "";
		for (let x = 0; x < grid[0].length; x++) {
			const top = grid[y]?.[x] ?? null;
			const bot = grid[y + 1]?.[x] ?? null;
			if (top && bot) {
				line += `\x1b[38;2;${top[0]};${top[1]};${top[2]};48;2;${bot[0]};${bot[1]};${bot[2]}m▀`;
			} else if (top) {
				line += `\x1b[38;2;${top[0]};${top[1]};${top[2]}m▀`;
			} else if (bot) {
				line += `\x1b[38;2;${bot[0]};${bot[1]};${bot[2]}m▄`;
			} else {
				line += " ";
			}
		}
		lines.push(margin + line.replace(/\s+$/, "") + "\x1b[0m");
	}
	return lines.join("\n");
}

// ── Public API ──

/**
 * Animated banner: render paw → quick pulse → arrow-key reactive → title.
 * No screen clear — renders at current cursor position.
 */
export async function showBanner(): Promise<void> {
	const base = MOOD_COLORS.wave;

	process.stdout.write("\x1B[?25l"); // hide cursor

	// Render paw
	const paw = renderPaw(generatePaw(base));
	process.stdout.write(paw + "\n");

	// Quick pulse animation (bright → dim → normal)
	for (const b of [1.2, 0.8, 1.1, 0.9, 1.0]) {
		process.stdout.write(`\x1B[${PAW_ROWS}A`);
		process.stdout.write(renderPaw(generatePaw(base, b)) + "\n");
		await sleep(50);
	}

	process.stdout.write("\x1B[?25h"); // show cursor

	// Arrow-key reactive (1.5s)
	await interactivePaw(1500, base);

	// Title
	console.log("");
	console.log(accent("  O P E N P A W"));
	console.log(dim("  Personal Assistant Wizard for Claude Code"));
	console.log("");
}

/**
 * Arrow-key reactive — paw shifts left/right.
 */
async function interactivePaw(ms: number, base: RGB): Promise<void> {
	return new Promise<void>((resolve) => {
		let offset = 0;

		readline.emitKeypressEvents(process.stdin);
		if (process.stdin.isTTY) process.stdin.setRawMode(true);
		process.stdin.resume();

		const draw = (ox: number) => {
			process.stdout.write(`\x1B[${PAW_ROWS}A\x1B[J`);
			process.stdout.write(renderPaw(generatePaw(base, 1.0, ox)) + "\n");
		};

		const onKey = (_s: string | undefined, key: readline.Key) => {
			if (!key) return;
			if (key.name === "left" && offset > -2) {
				offset -= 1;
				draw(offset);
			} else if (key.name === "right" && offset < 2) {
				offset += 1;
				draw(offset);
			} else if (key.name === "return" || key.name === "space") {
				done();
			}
		};

		const done = () => {
			process.stdin.removeListener("keypress", onKey);
			if (process.stdin.isTTY) process.stdin.setRawMode(false);
			process.stdin.pause();
			if (offset !== 0) draw(0);
			resolve();
		};

		process.stdin.on("keypress", onKey);
		setTimeout(done, ms);
	});
}

/**
 * Show paw between wizard steps — mood-colored, brief flash, then clears.
 */
export async function pawStep(
	mood: PawMood,
	message?: string,
): Promise<void> {
	const base = MOOD_COLORS[mood];
	const rendered = renderPaw(generatePaw(base));

	process.stdout.write(rendered + "\n");
	if (message) console.log(`  ${accent(message)}`);
	await sleep(350);

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
	const base = MOOD_COLORS.wave;
	console.log(renderPaw(generatePaw(base)));
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

export { brand, glow, accent, subtle, dim, bold };
