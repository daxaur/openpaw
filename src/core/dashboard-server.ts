import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import { generateDashboardHTML, generateFocusTimerHTML } from "./dashboard-html.js";
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
	noOpen?: boolean;
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
						themeParam === "neon" ||
						themeParam === "rose")
				) {
					current.theme = themeParam as DashboardTheme;
					writeConfig(current);
				}
				html(res, generateDashboardHTML(current.theme, current.botName));
				return;
			}

			// ── GET /focus — focus timer page ──
			if (method === "GET" && pathname === "/focus") {
				const current = readConfig();
				const ends = url.searchParams.get("ends") || "";
				const dur = url.searchParams.get("duration") || "0";
				html(
					res,
					generateFocusTimerHTML(
						current.theme,
						current.botName,
						ends,
						dur,
					),
				);
				return;
			}

			// ── GET /api/focus — session data for timer ──
			if (method === "GET" && pathname === "/api/focus") {
				try {
					const sessionPath = path.join(CONFIG_DIR, "lockin-session.json");
					const raw = fs.readFileSync(sessionPath, "utf-8");
					json(res, JSON.parse(raw));
				} catch {
					json(res, { active: false });
				}
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
					tags: Array.isArray(body.tags) ? body.tags.map(String).slice(0, 5) : undefined,
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
				if (body.tags !== undefined)
					task.tags = Array.isArray(body.tags) ? body.tags.map(String).slice(0, 5) : undefined;
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

			// ── DELETE /api/tasks/done — batch clear completed ──
			if (method === "DELETE" && pathname === "/api/tasks/done") {
				const current = readConfig();
				const removed = current.tasks.filter((t) => t.status === "done").length;
				current.tasks = current.tasks.filter((t) => t.status !== "done");
				writeConfig(current);
				json(res, { ok: true, removed });
				return;
			}

			// ── GET /api/standup — export as markdown ──
			if (method === "GET" && pathname === "/api/standup") {
				const current = readConfig();
				const today = new Date().toISOString().slice(0, 10);
				const done = current.tasks.filter((t) => t.status === "done");
				const inProg = current.tasks.filter((t) => t.status === "in-progress");
				const todo = current.tasks.filter((t) => t.status === "todo");
				const high = current.tasks.filter((t) => t.priority === "high" && t.status !== "done");

				let md = `# Standup — ${today}\n\n`;
				if (done.length) {
					md += `## Completed (${done.length})\n`;
					for (const t of done) md += `- ${t.title}${t.tags?.length ? ` [${t.tags.join(", ")}]` : ""}\n`;
					md += "\n";
				}
				if (inProg.length) {
					md += `## In Progress (${inProg.length})\n`;
					for (const t of inProg) md += `- ${t.title}${t.description ? ` — ${t.description}` : ""}\n`;
					md += "\n";
				}
				if (todo.length) {
					md += `## Todo (${todo.length})\n`;
					for (const t of todo) md += `- ${t.title}\n`;
					md += "\n";
				}
				if (high.length) {
					md += `## Blockers / High Priority\n`;
					for (const t of high) md += `- ${t.title}\n`;
					md += "\n";
				}
				md += `---\n*Generated by ${current.botName} Dashboard*\n`;

				res.writeHead(200, {
					"Content-Type": "text/markdown; charset=utf-8",
					"Content-Disposition": `attachment; filename="standup-${today}.md"`,
				});
				res.end(md);
				return;
			}

			// ── GET /api/config ──
			if (method === "GET" && pathname === "/api/config") {
				const { theme, botName, port: p } = readConfig();
				json(res, { theme, botName, port: p });
				return;
			}

			// ── PUT /api/config ──
			if (method === "PUT" && pathname === "/api/config") {
				const body = await parseBody(req);
				const current = readConfig();
				if (body.theme && ["paw", "midnight", "neon", "rose"].includes(String(body.theme))) {
					current.theme = body.theme as DashboardTheme;
				}
				if (body.botName && typeof body.botName === "string") {
					current.botName = body.botName.slice(0, 20);
				}
				writeConfig(current);
				json(res, { theme: current.theme, botName: current.botName });
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

		if (!opts.noOpen) {
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
		}
	});

	return server;
}

export { readConfig, writeConfig, CONFIG_FILE };
