import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";

const pawGradient = gradient(["#a855f7", "#6366f1", "#3b82f6"]);

export function showBanner(): void {
	const banner = figlet.textSync("OpenPaw", {
		font: "ANSI Shadow",
		horizontalLayout: "fitted",
	});

	console.log("");
	console.log(pawGradient.multiline(banner));
	console.log(
		chalk.dim("  Personal Assistant Wizard for Claude Code"),
	);
	console.log(
		chalk.dim("  https://github.com/daxaur/openpaw"),
	);
	console.log("");
}

export function showMini(): void {
	console.log(pawGradient("  openpaw") + chalk.dim(" — Personal Assistant Wizard for Claude Code"));
}
