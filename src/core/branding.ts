import chalk from "chalk";
import gradient from "gradient-string";

const pawGradient = gradient(["#a855f7", "#6366f1", "#3b82f6"]);

const PAW_LOGO = `
    ▄▀▀▄  ▄▀▀▄
    █░░█  █░░█
    ▀▄▄▀  ▀▄▄▀
  ▄▀▀▄      ▄▀▀▄
  █░░█      █░░█
  ▀▄▄▀      ▀▄▄▀
      ▄██████▄
    ▄██░░░░░░██▄
   ██░░░░░░░░░░██
   ██░░░░░░░░░░██
    ▀██░░░░░░██▀
      ▀▀████▀▀`;

const BANNER_TEXT = `
   ┌─────────────────────────┐
   │  O P E N P A W  v0.1.0  │
   └─────────────────────────┘`;

export function showBanner(): void {
	console.log(pawGradient.multiline(PAW_LOGO));
	console.log(pawGradient.multiline(BANNER_TEXT));
	console.log(chalk.dim("   Personal Assistant Wizard"));
	console.log(chalk.dim("   for Claude Code"));
	console.log("");
}

export function showMini(): void {
	console.log(
		pawGradient("  ◉ openpaw") +
			chalk.dim(" — Personal Assistant Wizard for Claude Code"),
	);
}
