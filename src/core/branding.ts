import chalk from "chalk";
import gradient from "gradient-string";

// ── Color Palette ──
// Stripe-inspired indigo/violet — clean on dark and light terminals
const brand = gradient(["#7c3aed", "#a78bfa", "#c4b5fd"]);
const accent = chalk.hex("#a78bfa");
const dim = chalk.dim;
const bold = chalk.bold;

// ── Paw Art ──
// Braille unicode paw — 4 toe beans + palm pad
const PAW = `
            ⣀⣀        ⣀⣀
          ⣴⣿⣿⣷      ⣴⣿⣿⣷
          ⠻⣿⣿⠟      ⠻⣿⣿⠟
       ⣀⣀              ⣀⣀
     ⣴⣿⣿⣷            ⣴⣿⣿⣷
     ⠻⣿⣿⠟            ⠻⣿⣿⠟
          ⣠⣴⣶⣶⣶⣶⣶⣶⣄
        ⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷
       ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
        ⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟
          ⠙⠻⢿⣿⣿⣿⣿⡿⠟⠁`;

const PAW_SMALL = `     ⣀⣀    ⣀⣀
   ⣴⣿⣿⣷  ⣴⣿⣿⣷
   ⠻⣿⣿⠟  ⠻⣿⣿⠟
  ⣀⣀          ⣀⣀
⣴⣿⣿⣷        ⣴⣿⣿⣷
⠻⣿⣿⠟        ⠻⣿⣿⠟
     ⣴⣶⣶⣶⣶⣶⣶⣄
   ⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
   ⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟
     ⠙⠻⢿⣿⣿⡿⠟⠁`;

// ── Paw expressions for wizard steps ──
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
 * Animate a paw pulse — bold/dim flicker effect.
 * Renders in-place using cursor-up + erase.
 */
export async function pawPulse(mood: PawMood, message?: string): Promise<void> {
	const m = PAW_MOODS[mood];
	const text = message ?? m.text;
	const line = `  ${m.emoji} ${accent(text)}`;
	const lineCount = 1;

	for (let i = 0; i < 4; i++) {
		if (i > 0) {
			process.stdout.write(`\x1B[${lineCount}A`); // cursor up
		}
		const style = i % 2 === 0 ? bold : dim;
		process.stdout.write(`\x1B[2K${style(line)}\n`); // erase line + write
		await sleep(120);
	}
	// Final render (normal)
	process.stdout.write(`\x1B[${lineCount}A`);
	process.stdout.write(`\x1B[2K${line}\n`);
}

/**
 * Animated banner — paw fades in with gradient.
 */
export async function showBanner(): Promise<void> {
	process.stdout.write("\x1B[2J\x1B[H"); // clear screen

	// Fade-in: dim → normal → bright
	const styles = [chalk.dim, (s: string) => s, chalk.bold];
	for (const style of styles) {
		process.stdout.write("\x1B[H"); // cursor home
		const rendered = brand.multiline(PAW);
		const styled = rendered
			.split("\n")
			.map((line) => style(line))
			.join("\n");
		console.log(styled);
		await sleep(100);
	}

	// Final render clean
	process.stdout.write("\x1B[H");
	console.log(brand.multiline(PAW));
	console.log("");
	console.log(accent("   ┌─────────────────────────────────┐"));
	console.log(accent("   │") + bold.white("     O P E N P A W   v0.1.0      ") + accent("│"));
	console.log(accent("   └─────────────────────────────────┘"));
	console.log("");
	console.log(dim("   Personal Assistant Wizard for Claude Code"));
	console.log("");
}

/**
 * Static banner — no animation.
 */
export function showBannerStatic(): void {
	console.log(brand.multiline(PAW_SMALL));
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
	console.log(accent("  ◉ openpaw") + dim(" — Personal Assistant Wizard for Claude Code"));
}

export { brand, accent, dim, bold };
