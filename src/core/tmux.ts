import { execSync, spawn } from "node:child_process";

export function isTmuxAvailable(): boolean {
	try {
		execSync("command -v tmux", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

export function isInTmux(): boolean {
	return !!process.env.TMUX;
}

export interface TmuxLaunchOptions {
	sessionName?: string;
	nativeCmd?: string;
	telegramCmd?: string;
	workDir: string;
}

export function launchInTmux(opts: TmuxLaunchOptions): void {
	const session = opts.sessionName || "openpaw";

	// Kill existing session if any
	try {
		execSync(`tmux kill-session -t ${session} 2>/dev/null`, { stdio: "ignore" });
	} catch {
		// Session didn't exist
	}

	if (opts.nativeCmd && opts.telegramCmd) {
		// Both: create session with native, split for telegram
		execSync(`tmux new-session -d -s ${session} -c "${opts.workDir}" '${opts.nativeCmd}'`);
		execSync(`tmux split-window -h -t ${session} '${opts.telegramCmd}'`);
		execSync(`tmux select-pane -t ${session}:0.0`);
		execSync(`tmux attach -t ${session}`, { stdio: "inherit" });
	} else if (opts.nativeCmd) {
		execSync(`tmux new-session -s ${session} -c "${opts.workDir}" '${opts.nativeCmd}'`, { stdio: "inherit" });
	} else if (opts.telegramCmd) {
		execSync(`tmux new-session -s ${session} '${opts.telegramCmd}'`, { stdio: "inherit" });
	}
}

export function launchInBackground(cmd: string): void {
	const child = spawn("bash", ["-c", cmd], {
		detached: true,
		stdio: "ignore",
	});
	child.unref();
}
