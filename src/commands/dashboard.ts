import { startDashboard } from "../core/dashboard-server.js";
import type { DashboardTheme } from "../types.js";

export function dashboardCommand(opts: {
	port?: string;
	theme?: string;
}): void {
	const port = opts.port ? Number.parseInt(opts.port, 10) : undefined;
	const theme =
		opts.theme &&
		(opts.theme === "paw" || opts.theme === "midnight" || opts.theme === "neon")
			? (opts.theme as DashboardTheme)
			: undefined;

	startDashboard({ port, theme });
}
