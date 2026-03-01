import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import { generateDashboardHTML } from "./dashboard-html.js";
import type { DashboardConfig, DashboardTask, DashboardTheme } from "../types.js";

const CONFIG_DIR = path.join(os.homedir(), ".config", "openpaw");
const CONFIG_FILE = path.join(CONFIG_DIR, "dashboard.json");

function readConfig(): DashboardConfig {
	try {
		return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
	} catch {
		return { theme: "paw", botName: "Paw", port: 3141, tasks: [] };
	}
}

function writeConfig(config: DashboardConfig): void {
	if (!fs.existsSync(CONFIG_DIR)) {
		fs.mkdirSync(CONFIG_DIR, { recursive: true });
	}
	fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
	return new Promise((resolve, reject) => {
		let body = "";
		req.on("data", (chunk: Buffer) => {
			body += chunk.toString();
		});
		req.on("end", () => {
			try {
				resolve(body ? JSON.parse(body) : {});
			} catch {
				reject(new Error("Invalid JSON"));
			}
		});
		req.on("error", reject);
	});
}

function json(res: http.ServerResponse, data: unknown, status = 200): void {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(data));
}

function html(res: http.ServerResponse, content: string): void {
	res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	res.end(content);
}

export function startDashboard(opts: {
	port?: number;
	theme?: DashboardTheme;
	botName?: string;
}): http.Server {
	const config = readConfig();
	if (opts.theme) config.theme = opts.theme;
	if (opts.botName) config.botName = opts.botName;
	if (opts.port) config.port = opts.port;
	writeConfig(config);

	const port = config.port || 3141;

	const server = http.createServer(async (req, res) => {
		const url = new URL(req.url || "/", `http://localhost:${port}`);
		const method = req.method || "GET";
		const pathname = url.pathname;

		try {
			// ── GET / — serve dashboard HTML ──
			if (method === "GET" && pathname === "/") {
				const current = readConfig();
				const themeParam = url.searchParams.get("theme");
				if (
					themeParam &&
					(themeParam === "paw" ||
						themeParam === "midnight" ||
						themeParam === "neon")
				) {
					current.theme = themeParam as DashboardTheme;
					writeConfig(current);
				}
				html(res, generateDashboardHTML(current.theme, current.botName));
				return;
			}

			// ── GET /api/tasks ──
			if (method === "GET" && pathname === "/api/tasks") {
				json(res, readConfig().tasks);
				return;
			}

			// ── POST /api/tasks ──
			if (method === "POST" && pathname === "/api/tasks") {
				const body = await parseBody(req);
				const current = readConfig();
				const task: DashboardTask = {
					id: crypto.randomUUID().slice(0, 8),
					title: String(body.title || "Untitled"),
					description: body.description ? String(body.description) : undefined,
					status: (body.status as DashboardTask["status"]) || "todo",
					priority: (body.priority as DashboardTask["priority"]) || "normal",
					order: current.tasks.filter(
						(t) => t.status === (body.status || "todo"),
					).length,
					createdAt: new Date().toISOString(),
				};
				current.tasks.push(task);
				writeConfig(current);
				json(res, task, 201);
				return;
			}

			// ── PUT /api/tasks/:id ──
			const putMatch = method === "PUT" && pathname.match(/^\/api\/tasks\/(.+)$/);
			if (putMatch) {
				const id = putMatch[1];
				const body = await parseBody(req);
				const current = readConfig();
				const task = current.tasks.find((t) => t.id === id);
				if (!task) {
					json(res, { error: "Not found" }, 404);
					return;
				}
				if (body.title !== undefined) task.title = String(body.title);
				if (body.description !== undefined)
					task.description = body.description
						? String(body.description)
						: undefined;
				if (body.status !== undefined)
					task.status = body.status as DashboardTask["status"];
				if (body.priority !== undefined)
					task.priority = body.priority as DashboardTask["priority"];
				if (body.order !== undefined) task.order = Number(body.order);
				writeConfig(current);
				json(res, task);
				return;
			}

			// ── DELETE /api/tasks/:id ──
			const delMatch =
				method === "DELETE" && pathname.match(/^\/api\/tasks\/(.+)$/);
			if (delMatch) {
				const id = delMatch[1];
				const current = readConfig();
				current.tasks = current.tasks.filter((t) => t.id !== id);
				writeConfig(current);
				json(res, { ok: true });
				return;
			}

			// ── GET /api/config ──
			if (method === "GET" && pathname === "/api/config") {
				const { theme, botName, port: p } = readConfig();
				json(res, { theme, botName, port: p });
				return;
			}

			// ── 404 ──
			json(res, { error: "Not found" }, 404);
		} catch (err) {
			json(res, { error: "Internal error" }, 500);
		}
	});

	server.listen(port, () => {
		const url = `http://localhost:${port}`;
		console.log(`\n  Dashboard running at ${url}\n`);

		// Auto-open browser
		const platform = os.platform();
		if (platform === "darwin") {
			import("node:child_process").then((cp) =>
				cp.exec(`open ${url}`),
			);
		} else if (platform === "linux") {
			import("node:child_process").then((cp) =>
				cp.exec(`xdg-open ${url}`),
			);
		}
	});

	return server;
}

export { readConfig, writeConfig, CONFIG_FILE };
