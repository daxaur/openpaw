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
// Procedural 3D-shaded paw print using half-block pixel art.
// Each character cell packs 2 vertical pixels via ▀ (upper half block)
// with truecolor foreground (top pixel) + background (bottom pixel).

type RGB = [number, number, number];

interface PawPalette {
	top: RGB;
	bottom: RGB;
	highlight: number;
}

interface Pad {
	cx: number;
	cy: number;
	rx: number;
	ry: number;
}

const W = 23;
const H = 16;
const PAW_ROWS = H / 2; // 8 output character rows
const MARGIN = "  ";

// Pad layout — 4 toes in arc + 1 palm
const BASE_PADS: Pad[] = [
	{ cx: 8, cy: 1.5, rx: 2.3, ry: 1.8 },
	{ cx: 14, cy: 1.5, rx: 2.3, ry: 1.8 },
	{ cx: 4, cy: 4, rx: 2.0, ry: 1.8 },
	{ cx: 18, cy: 4, rx: 2.0, ry: 1.8 },
	{ cx: 11, cy: 11, rx: 5.5, ry: 4.5 },
];

// ── Mood palettes ──
export type PawMood = "wave" | "think" | "happy" | "work" | "done" | "warn";

const PALETTES: Record<PawMood, PawPalette> = {
	wave: { top: [155, 125, 235], bottom: [55, 220, 200], highlight: 0.22 },
	think: { top: [90, 110, 200], bottom: [60, 150, 210], highlight: 0.12 },
	happy: { top: [220, 170, 80], bottom: [255, 120, 80], highlight: 0.25 },
	work: { top: [120, 90, 200], bottom: [50, 160, 180], highlight: 0.10 },
	done: { top: [60, 210, 190], bottom: [48, 230, 210], highlight: 0.25 },
	warn: { top: [220, 160, 50], bottom: [220, 80, 50], highlight: 0.15 },
};

function clamp(v: number): number {
	return Math.min(255, Math.max(0, Math.round(v)));
}

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// ── Pixel grid generation ──

function generatePaw(
	palette: PawPalette,
	brightness = 1.0,
	offsetX = 0,
): (RGB | null)[][] {
	const pads = offsetX === 0
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

				// Anti-aliased edge
				let alpha: number;
				if (dist <= 0.85) alpha = 1.0;
				else if (dist <= 1.0) alpha = 1.0 - (dist - 0.85) / 0.15;
				else continue;

				// Vertical gradient
				const t = y / H;
				const baseR = palette.top[0] * (1 - t) + palette.bottom[0] * t;
				const baseG = palette.top[1] * (1 - t) + palette.bottom[1] * t;
				const baseB = palette.top[2] * (1 - t) + palette.bottom[2] * t;

				// 3D depth: edge darkening + directional light
				const edge = 1.0 - dist * 0.15;
				const light = 1.0 + -dx * 0.1 + -dy * 0.1;

				// Specular highlight (top-left of each pad)
				const specD = Math.sqrt((dx + 0.3) ** 2 + (dy + 0.35) ** 2);
				const spec =
					Math.max(0, 1.0 - specD * 1.2) * palette.highlight * 255;

				const shade = Math.max(0.2, edge * light) * alpha * brightness;
				grid[y][x] = [
					clamp(baseR * shade + spec * alpha * brightness),
					clamp(baseG * shade + spec * alpha * brightness),
					clamp(baseB * shade + spec * alpha * brightness),
				];
				break;
			}
		}
	}
	return grid;
}

// ── Truecolor half-block renderer ──

function renderPaw(grid: (RGB | null)[][]): string {
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
		lines.push(MARGIN + line.replace(/\s+$/, "") + "\x1b[0m");
	}
	return lines.join("\n");
}

// ── Public API ──

/**
 * Animated banner: fade-in → pulse → arrow-key reactive → title.
 */
export async function showBanner(): Promise<void> {
	process.stdout.write("\x1B[2J\x1B[H");
	process.stdout.write("\x1B[?25l");

	const pal = PALETTES.wave;

	// Phase 1: Fade in (dark → full brightness)
	for (let frame = 0; frame <= 8; frame++) {
		const brightness = frame / 8;
		const grid = generatePaw(pal, brightness);
		process.stdout.write("\x1B[H");
		process.stdout.write(renderPaw(grid) + "\n");
		await sleep(40);
	}

	// Phase 2: Pulse (brightness oscillation)
	const pulseFrames = [1.15, 0.85, 1.1, 0.9, 1.0];
	for (const b of pulseFrames) {
		process.stdout.write("\x1B[H");
		process.stdout.write(renderPaw(generatePaw(pal, b)) + "\n");
		await sleep(60);
	}

	process.stdout.write("\x1B[?25h");

	// Phase 3: Arrow-key reactive (1.5s)
	await interactivePaw(1500, pal);

	// Title
	console.log(accent("  ┌───────────────────────────────┐"));
	console.log(
		accent("  │") +
			bold.white("    O P E N P A W   v0.1.0     ") +
			accent("│"),
	);
	console.log(accent("  └───────────────────────────────┘"));
	console.log(dim("  Personal Assistant Wizard for Claude Code"));
	console.log("");
}

/**
 * Arrow-key reactive — paw shifts left/right with arrow keys.
 */
async function interactivePaw(
	ms: number,
	pal: PawPalette,
): Promise<void> {
	return new Promise<void>((resolve) => {
		let offset = 0;

		readline.emitKeypressEvents(process.stdin);
		if (process.stdin.isTTY) process.stdin.setRawMode(true);
		process.stdin.resume();

		const draw = (ox: number) => {
			process.stdout.write(`\x1B[${PAW_ROWS}A\x1B[J`);
			process.stdout.write(renderPaw(generatePaw(pal, 1.0, ox)) + "\n");
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
 * Show paw between wizard steps — renders in mood color, pauses, clears.
 */
export async function pawStep(
	mood: PawMood,
	message?: string,
): Promise<void> {
	const pal = PALETTES[mood];
	const rendered = renderPaw(generatePaw(pal));

	console.log(rendered);
	if (message) console.log(`  ${accent(message)}`);
	await sleep(400);

	// Clear: paw rows + optional message line
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
	const pal = PALETTES[mood];
	const [r, g, b] = pal.top;
	const dot = `\x1b[38;2;${r};${g};${b}m◉\x1b[0m`;
	const line = `  ${dot} ${subtle(message)}`;

	for (let i = 0; i < 3; i++) {
		if (i > 0) process.stdout.write("\x1B[1A");
		const s = i % 2 === 0 ? bold : dim;
		process.stdout.write(`\x1B[2K${s(line)}\n`);
		await sleep(80);
	}
	process.stdout.write(`\x1B[1A\x1B[2K${line}\n`);
}

/**
 * Static banner — no animation, for non-TTY or quick display.
 */
export function showBannerStatic(): void {
	const pal = PALETTES.wave;
	console.log(renderPaw(generatePaw(pal)));
	console.log("");
	console.log(accent("  ┌───────────────────────────────┐"));
	console.log(
		accent("  │") +
			bold.white("    O P E N P A W   v0.1.0     ") +
			accent("│"),
	);
	console.log(accent("  └───────────────────────────────┘"));
	console.log("");
}

/**
 * Mini one-liner for subcommands.
 */
export function showMini(): void {
	console.log(
		accent("  ◉ openpaw") +
			dim(" — Personal Assistant Wizard for Claude Code"),
	);
}

export { brand, glow, accent, subtle, dim, bold };
