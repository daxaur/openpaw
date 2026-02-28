import * as p from "@clack/prompts";
import { Bot, type Context } from "grammy";
import { hydrate, type HydrateFlavor } from "@grammyjs/hydrate";
import { query } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { accent, dim, bold } from "./branding.js";
import type { TelegramConfig } from "../types.js";
import { listInstalledSkills } from "./skills.js";

type BotContext = HydrateFlavor<Context>;

const CONFIG_DIR = path.join(os.homedir(), ".config", "openpaw");
const CONFIG_PATH = path.join(CONFIG_DIR, "telegram.json");

// ── Config Management ──

export function writeTelegramConfig(config: TelegramConfig): void {
	fs.mkdirSync(CONFIG_DIR, { recursive: true });
	fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
	fs.chmodSync(CONFIG_PATH, 0o600);
}

export function readTelegramConfig(): TelegramConfig | null {
	try {
		const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
		return JSON.parse(raw) as TelegramConfig;
	} catch {
		return null;
	}
}

export function telegramConfigExists(): boolean {
	return fs.existsSync(CONFIG_PATH);
}

// ── Wizard Questionnaire ──

export async function telegramQuestionnaire(): Promise<TelegramConfig | null> {
	p.log.info(dim("Let's set up your Telegram bot! You'll need:"));
	p.log.info(`  ${accent("1.")} Message ${bold("@BotFather")} on Telegram → /newbot`);
	p.log.info(`  ${accent("2.")} Message ${bold("@userinfobot")} to get your user ID`);
	console.log("");

	const botToken = await p.text({
		message: "Paste your bot token (from @BotFather):",
		placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
		validate: (v) => {
			if (v.length === 0) return "Bot token is required";
			if (!v.includes(":")) return "That doesn't look like a bot token (should contain ':')";
			return undefined;
		},
	});

	if (p.isCancel(botToken)) return null;

	const userId = await p.text({
		message: "Your Telegram user ID (from @userinfobot):",
		placeholder: "123456789",
		validate: (v) => {
			if (v.length === 0) return "User ID is required";
			if (!/^\d+$/.test(v)) return "User ID should be a number";
			return undefined;
		},
	});

	if (p.isCancel(userId)) return null;

	return {
		botToken: botToken as string,
		allowedUserIds: [(userId as string).trim()],
		workspaceDir: os.homedir(),
		model: "sonnet",
		skills: [],
	};
}

// ── Bot Startup ──

// Active sessions per user (for multi-turn conversations)
const sessions = new Map<number, { sessionId?: string; controller?: AbortController }>();

// Model name mapping
const MODEL_MAP: Record<string, string> = {
	sonnet: "claude-sonnet-4-5-20250514",
	opus: "claude-opus-4-6",
	haiku: "claude-haiku-4-5-20251001",
};

function getModelId(shortName: string): string {
	return MODEL_MAP[shortName] || MODEL_MAP.sonnet;
}

export async function startTelegramBot(config: TelegramConfig): Promise<void> {
	const bot = new Bot<BotContext>(config.botToken);
	bot.use(hydrate());

	const allowedIds = new Set(config.allowedUserIds.map(Number));
	let currentModel = config.model || "sonnet";

	// ── Auth middleware ──
	bot.use(async (ctx, next) => {
		if (!ctx.from || !allowedIds.has(ctx.from.id)) {
			await ctx.reply("Woof! I don't know you. Unauthorized. 🐾");
			return;
		}
		await next();
	});

	// ── Register skill commands with Telegram ──
	const installedSkills = listInstalledSkills();
	const skillCommands = installedSkills
		.filter((id) => id !== "core" && id !== "memory")
		.map((id) => ({ command: id, description: `Use the ${id} skill` }));

	const allCommands = [
		{ command: "start", description: "Start the bot" },
		{ command: "model", description: "Switch Claude model (sonnet/opus/haiku)" },
		{ command: "skills", description: "List installed skills" },
		{ command: "stop", description: "Cancel current operation" },
		{ command: "clear", description: "Reset conversation" },
		...skillCommands,
	];

	try {
		await bot.api.setMyCommands(allCommands);
	} catch {
		// Non-fatal — commands just won't show in Telegram UI
	}

	// ── /start ──
	bot.command("start", async (ctx) => {
		const skills = installedSkills.filter((id) => id !== "core" && id !== "memory");
		await ctx.reply(
			`*PAW MODE active* 🐾\n\n` +
			`I'm your personal assistant, powered by OpenPaw.\n` +
			`Model: \`${currentModel}\`\n` +
			`Skills: ${skills.length > 0 ? skills.map((s) => `/${s}`).join(", ") : "none"}\n\n` +
			`Just send me a message or use a /command!`,
			{ parse_mode: "Markdown" },
		);
	});

	// ── /model ──
	bot.command("model", async (ctx) => {
		const arg = ctx.match?.trim().toLowerCase();
		if (!arg || !["sonnet", "opus", "haiku"].includes(arg)) {
			await ctx.reply(
				`Current model: \`${currentModel}\`\n\n` +
				`Switch with:\n` +
				`/model sonnet\n` +
				`/model opus\n` +
				`/model haiku`,
				{ parse_mode: "Markdown" },
			);
			return;
		}
		currentModel = arg;
		config.model = arg;
		writeTelegramConfig(config);
		await ctx.reply(`Model switched to \`${currentModel}\` 🐾`, { parse_mode: "Markdown" });
	});

	// ── /skills ──
	bot.command("skills", async (ctx) => {
		const skills = installedSkills.filter((id) => id !== "core" && id !== "memory");
		if (skills.length === 0) {
			await ctx.reply("No skills installed yet. Run `openpaw setup` first! 🐾");
			return;
		}
		const list = skills.map((s) => `• /${s}`).join("\n");
		await ctx.reply(`*Installed skills:*\n\n${list}`, { parse_mode: "Markdown" });
	});

	// ── /stop ──
	bot.command("stop", async (ctx) => {
		const userId = ctx.from!.id;
		const session = sessions.get(userId);
		if (session?.controller) {
			session.controller.abort();
			sessions.delete(userId);
			await ctx.reply("Operation cancelled. 🐾");
		} else {
			await ctx.reply("Nothing running right now. 🐾");
		}
	});

	// ── /clear ──
	bot.command("clear", async (ctx) => {
		const userId = ctx.from!.id;
		sessions.delete(userId);
		await ctx.reply("Conversation cleared! Fresh start. 🐾");
	});

	// ── Skill commands (dynamic) ──
	for (const skillId of installedSkills) {
		if (skillId === "core" || skillId === "memory") continue;
		bot.command(skillId, async (ctx) => {
			const args = ctx.match || "";
			const prompt = args
				? `Use the c-${skillId} skill: ${args}`
				: `What can the c-${skillId} skill do? Give a brief overview.`;
			await handleClaudeMessage(ctx, prompt, currentModel, config);
		});
	}

	// ── Regular text messages ──
	bot.on("message:text", async (ctx) => {
		await handleClaudeMessage(ctx, ctx.msg.text, currentModel, config);
	});

	// ── Error handling ──
	bot.catch((err) => {
		console.error("Bot error:", err.message || err);
	});

	// ── Graceful shutdown ──
	process.on("SIGINT", () => {
		console.log("\nShutting down gracefully... 🐾");
		bot.stop();
		process.exit(0);
	});
	process.on("SIGTERM", () => {
		bot.stop();
		process.exit(0);
	});

	// ── Start ──
	console.log("");
	console.log(`  🐾 ${bold("OpenPaw Telegram Bridge")}`);
	console.log(`     Model: ${accent(currentModel)}`);
	console.log(`     Skills: ${accent(String(installedSkills.length))}`);
	console.log(`     Workspace: ${dim(config.workspaceDir)}`);
	console.log(`     Allowed users: ${dim(config.allowedUserIds.join(", "))}`);
	console.log("");
	console.log(dim("  Listening for messages... (Ctrl+C to stop)"));
	console.log("");

	await bot.start();
}

// ── Claude Message Handler ──

async function handleClaudeMessage(
	ctx: BotContext,
	prompt: string,
	model: string,
	config: TelegramConfig,
): Promise<void> {
	const userId = ctx.from!.id;

	// Cancel any existing request for this user
	const existing = sessions.get(userId);
	if (existing?.controller) {
		existing.controller.abort();
	}

	const controller = new AbortController();
	const session = sessions.get(userId) || {};
	session.controller = controller;
	sessions.set(userId, session);

	// Send initial "thinking" message
	const statusMsg = await ctx.reply("Thinking... 🐾");

	let fullText = "";
	let lastEditTime = 0;
	const EDIT_INTERVAL = 1500; // Telegram rate limits: don't edit more than every 1.5s

	try {
		const q = query({
			prompt,
			options: {
				model: getModelId(model),
				permissionMode: "bypassPermissions",
				allowDangerouslySkipPermissions: true,
				cwd: config.workspaceDir,
				abortController: controller,
				maxTurns: 25,
				...(session.sessionId ? { resume: session.sessionId } : {}),
			},
		});

		for await (const message of q) {
			if (controller.signal.aborted) break;

			if (message.type === "system" && "session_id" in message) {
				session.sessionId = (message as { session_id: string }).session_id;
			}

			if (message.type === "assistant") {
				const msgContent = (message as { message: { content: Array<{ type: string; text?: string }> } }).message;
				const text = msgContent.content
					.filter((block: { type: string }) => block.type === "text")
					.map((block: { text?: string }) => block.text || "")
					.join("");

				if (text) {
					fullText = text;
					const now = Date.now();
					if (now - lastEditTime > EDIT_INTERVAL) {
						lastEditTime = now;
						const truncated = fullText.length > 4000 ? `${fullText.slice(0, 4000)}...` : fullText;
						try {
							await statusMsg.editText(truncated);
						} catch {
							// Edit might fail if content hasn't changed
						}
					}
				}
			}

			if (message.type === "result") {
				const result = (message as { result?: string }).result;
				if (result) fullText = result;
			}
		}

		// Final edit with complete response
		if (fullText) {
			const truncated = fullText.length > 4000 ? `${fullText.slice(0, 4000)}...` : fullText;
			try {
				await statusMsg.editText(truncated);
			} catch {
				// If edit fails, send as new message
				await ctx.reply(truncated);
			}
		} else {
			await statusMsg.editText("Done! (no text output) 🐾");
		}
	} catch (err: unknown) {
		const errorMsg = err instanceof Error ? err.message : "Unknown error";
		if (errorMsg.includes("abort") || controller.signal.aborted) {
			// User cancelled — already handled
			return;
		}
		try {
			await statusMsg.editText(`Woof, something went wrong: ${errorMsg.slice(0, 200)} 🐾`);
		} catch {
			await ctx.reply(`Woof, something went wrong: ${errorMsg.slice(0, 200)} 🐾`);
		}
	} finally {
		session.controller = undefined;
		sessions.set(userId, session);
	}
}
