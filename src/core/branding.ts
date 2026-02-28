import chalk from "chalk";
import gradient from "gradient-string";

const pawGradient = gradient(["#a855f7", "#6366f1", "#3b82f6"]);
const accentGradient = gradient(["#6366f1", "#8b5cf6", "#a855f7"]);

const PAW_FRAMES = [
	`
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
            ⠙⠻⢿⣿⣿⣿⣿⡿⠟⠁`,
	`
              ⣠⣤        ⣠⣤
            ⣰⣿⣿⣿      ⣰⣿⣿⣿
            ⠹⣿⣿⠏      ⠹⣿⣿⠏
         ⣠⣤              ⣠⣤
       ⣰⣿⣿⣿            ⣰⣿⣿⣿
       ⠹⣿⣿⠏            ⠹⣿⣿⠏
            ⣠⣴⣶⣶⣶⣶⣶⣶⣄
          ⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
         ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
         ⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿
          ⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋
            ⠈⠛⠿⣿⣿⣿⣿⠿⠛⠁`,
];

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

export async function showBanner(): Promise<void> {
	// Animate: show each frame briefly
	for (let i = 0; i < 3; i++) {
		const frame = PAW_FRAMES[i % PAW_FRAMES.length];
		process.stdout.write("\x1B[2J\x1B[H"); // clear screen
		console.log(pawGradient.multiline(frame));
		await sleep(150);
	}

	// Final frame stays
	const finalFrame = PAW_FRAMES[1];
	process.stdout.write("\x1B[2J\x1B[H");
	console.log(pawGradient.multiline(finalFrame));
	console.log("");
	console.log(accentGradient("   ╔═══════════════════════════════╗"));
	console.log(accentGradient("   ║") + chalk.bold.white("    O P E N P A W   v0.1.0    ") + accentGradient("║"));
	console.log(accentGradient("   ╚═══════════════════════════════╝"));
	console.log("");
	console.log(chalk.dim("   Personal Assistant Wizard for Claude Code"));
	console.log(chalk.dim("   github.com/daxaur/openpaw"));
	console.log("");
}

export async function showBannerStatic(): Promise<void> {
	console.log(pawGradient.multiline(PAW_FRAMES[1]));
	console.log("");
	console.log(accentGradient("   ╔═══════════════════════════════╗"));
	console.log(accentGradient("   ║") + chalk.bold.white("    O P E N P A W   v0.1.0    ") + accentGradient("║"));
	console.log(accentGradient("   ╚═══════════════════════════════╝"));
	console.log("");
}

export function showMini(): void {
	console.log(
		pawGradient("  ◉ openpaw") +
			chalk.dim(" — Personal Assistant Wizard for Claude Code"),
	);
}
