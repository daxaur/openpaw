import * as p from "@clack/prompts";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { spawn } from "node:child_process";
import { showMini, accent, dim, bold, subtle } from "../core/branding.js";
import { getDefaultSkillsDir, listInstalledSkills } from "../core/skills.js";
import {
	readLockInConfig,
	writeLockInConfig,
	lockInConfigExists,
	detectCapabilities,
	readLockInSession,
	writeLockInSession,
	clearLockInSession,
	blockSites,
	unblockSites,
	quitApps,
	enableDnd,
	disableDnd,
	enableSlackDnd,
	setLights,
	connectBluetooth,
	startMusic,
	stopMusic,
	getGitCommitCount,
	getGitDiffStats,
	sendNotification,
	logToObsidian,
	COMMON_BLOCKED_SITES,
	COMMON_QUIT_APPS,
	saveWindowPositions,
	restoreWindows,
	startRoastServer,
	stopRoastServer,
	getFrontmostApp,
	centerAndResizeApp,
	minimizeOtherWindows,
	getGitCommitMessages,
} from "../core/lockin.js";
import type { LockInConfig, LockInMusicSource } from "../types.js";

// ── Lock In (show config + status) ──

export function lockInCommand(): void {
	showMini();
	console.log("");

	const config = readLockInConfig();
	if (!config) {
		p.log.warn("Lock In Mode isn't set up yet.");
		p.log.info(`Run ${bold("openpaw lockin setup")} to configure your environment.`);
		return;
	}

	// Check for active session
	const session = readLockInSession();
	if (session) {
		const endsAt = new Date(session.endsAt);
		const now = new Date();
		if (endsAt > now) {
			const remaining = Math.round((endsAt.getTime() - now.getTime()) / 60000);
			const elapsed = Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 60000);
			p.note(
				[
					`${bold("Status:")}       ${accent("active")}`,
					`${bold("Elapsed:")}      ${elapsed} min`,
					`${bold("Remaining:")}    ${remaining} min`,
					`${bold("Ends at:")}      ${endsAt.toLocaleTimeString()}`,
				].join("\n"),
				"Lock In Session",
			);
			p.log.info(dim("Claude is managing this session. Tell Claude to end it, or run ") + bold("openpaw lockin end"));
			return;
		}
		// Session expired
		p.log.warn("Previous session expired. Run " + bold("openpaw lockin end") + " to clean up.");
	}

	// Show config
	printConfig(config);
	console.log("");
	p.log.info(dim("Tell Claude to ") + bold("lock in") + dim(" to start a session."));
	p.log.info(dim("Reconfigure: ") + bold("openpaw lockin setup"));
}

function scheduleEndNotification(minutes: number): void {
	const seconds = minutes * 60;
	try {
		const child = spawn("sh", ["-c", `sleep ${seconds} && terminal-notifier -title "Lock In Complete" -message "Your ${minutes}-minute session is done!" -sound default`], {
			detached: true,
			stdio: "ignore",
		});
		child.unref();
	} catch {}
}

function scheduleLockInEndSession(minutes: number): void {
	const seconds = minutes * 60;
	// Resolve the CLI entry point so it works from any cwd
	const cli = path.resolve(process.argv[1]);
	try {
		// Sleep N minutes, then run `openpaw lockin auto-end` which spawns a Claude session
		const child = spawn("sh", ["-c", `sleep ${seconds} && node "${cli}" lockin auto-end`], {
			detached: true,
			stdio: "ignore",
			env: { ...process.env },
		});
		child.unref();
	} catch {}
}

/**
 * Auto-end: spawns a Claude session that ends the lock-in, reads the receipt,
 * and sends a natural summary via Telegram (or saves to file).
 */
export async function lockInAutoEndCommand(): Promise<void> {
	const config = readLockInConfig();
	const session = readLockInSession();
	if (!session || !config) return;

	// Restore environment first
	restoreEnvironment(config, session);

	// Generate receipt data
	const startTime = new Date(session.startedAt);
	const elapsed = Math.round((Date.now() - startTime.getTime()) / 60000);
	const stats = getGitDiffStats(session.gitCommitsBefore);
	const commitMessages = getGitCommitMessages(session.gitCommitsBefore);

	const receiptLines = [
		`Duration: ${elapsed} min`,
		`Commits: ${stats.commits}`,
		`Lines added: +${stats.linesAdded}`,
		`Lines removed: -${stats.linesRemoved}`,
	];
	if (commitMessages.length > 0) {
		receiptLines.push("", "Commits:");
		for (const msg of commitMessages) receiptLines.push(`  ${msg}`);
	}
	const receipt = receiptLines.join("\n");

	// Obsidian log
	if (config.obsidianLog) {
		logToObsidian(elapsed, stats);
	}

	clearLockInSession();

	// Spawn a Claude session to write a natural summary
	try {
		const { query } = await import("@anthropic-ai/claude-agent-sdk");
		const prompt = `The user's lock-in session just ended. Here are the stats:\n\n${receipt}\n\nWrite a brief, encouraging 2-3 sentence summary of their session. Be specific about the numbers. If they made commits, mention the commit messages to highlight what they accomplished. If not, that's fine too — they were focused. Keep it casual and warm.`;

		let summary = "";
		const q = query({
			prompt,
			options: {
				model: "claude-haiku-4-5-20251001",
				permissionMode: "bypassPermissions",
				allowDangerouslySkipPermissions: true,
				maxTurns: 1,
			},
		});

		for await (const message of q) {
			if (message.type === "result") {
				const result = message as { result?: string };
				if (result.result) summary = result.result;
			}
		}

		if (!summary) summary = `Lock-in session complete: ${elapsed} min, ${stats.commits} commits, +${stats.linesAdded}/-${stats.linesRemoved} lines.`;

		// Deliver via Telegram if available, otherwise notification
		try {
			const { readTelegramConfig } = await import("../core/telegram.js");
			const tgConfig = readTelegramConfig();
			if (tgConfig) {
				for (const userId of tgConfig.allowedUserIds) {
					await fetch(`https://api.telegram.org/bot${tgConfig.botToken}/sendMessage`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ chat_id: userId, text: `🎯 *Lock In Complete*\n\n${summary}`, parse_mode: "Markdown" }),
					});
				}
				return;
			}
		} catch {}

		// Fallback: native notification
		sendNotification("Lock In Complete", summary.slice(0, 200));
	} catch {
		// SDK not available — just send basic notification
		sendNotification("Lock In Complete", `${elapsed} min session done. ${stats.commits} commits.`);
	}
}

// ── Non-interactive commands (for Claude Code) ──

export function lockInStartCommand(opts: { all?: boolean }): void {
	const config = readLockInConfig();
	if (!config) {
		console.log("Lock In Mode not configured. Run: openpaw lockin setup");
		process.exit(1);
	}

	const session = readLockInSession();
	if (session) {
		const endsAt = new Date(session.endsAt);
		if (endsAt > new Date()) {
			const remaining = Math.round((endsAt.getTime() - Date.now()) / 60000);
			console.log(`Lock-in session already active. ${remaining} min remaining.`);
			console.log(`Run "openpaw lockin end" to stop early.`);
			return;
		}
		// Expired — clean up silently
		restoreEnvironment(config, session);
		clearLockInSession();
	}

	const actions: string[] = [];
	const now = new Date();
	const endsAt = new Date(now.getTime() + config.duration * 60000);

	// Block sites
	const sites = opts.all
		? [...(config.blockedSites?.always ?? []), ...(config.blockedSites?.askEachTime ?? [])]
		: [...(config.blockedSites?.always ?? [])];
	if (sites.length > 0) {
		blockSites(sites);
		startRoastServer(endsAt.toISOString());
		actions.push(`Blocked ${sites.length} sites (with roast page)`);
	}

	// Quit apps
	const apps = opts.all
		? [...(config.quitApps?.always ?? []), ...(config.quitApps?.askEachTime ?? [])]
		: [...(config.quitApps?.always ?? [])];
	if (apps.length > 0) {
		quitApps(apps);
		actions.push(`Quit ${apps.length} apps: ${apps.join(", ")}`);
	}

	// Bluetooth
	if (config.bluetooth?.device) {
		connectBluetooth(config.bluetooth.device);
		actions.push(`Connected ${config.bluetooth.device}`);
	}

	// Music
	if (config.music) {
		startMusic(config.music);
		actions.push(`Playing ${config.music.source}: ${config.music.query}`);
	}

	// Lights
	if (config.lights) {
		setLights(config.lights.room, config.lights.brightness, config.lights.color);
		actions.push(`Set ${config.lights.room} lights to ${config.lights.brightness}%`);
	}

	// DND
	if (config.dnd) {
		enableDnd();
		actions.push("Enabled Do Not Disturb");
	}

	// Slack DND
	if (config.slackDnd) {
		enableSlackDnd(config.duration);
		actions.push(`Set Slack DND for ${config.duration} min`);
	}

	// Auto window management — runs LAST
	let savedPositions: string | undefined;
	const frontApp = getFrontmostApp();
	if (frontApp) {
		savedPositions = saveWindowPositions();
		minimizeOtherWindows(frontApp);
		centerAndResizeApp(frontApp);
		actions.push(`Centered ${frontApp}, minimized other windows`);
	}

	// Save session
	writeLockInSession({
		startedAt: now.toISOString(),
		endsAt: endsAt.toISOString(),
		config,
		blockedSiteAttempts: 0,
		gitCommitsBefore: getGitCommitCount(),
		savedWindowPositions: savedPositions,
	});

	// Timer
	if (config.timer) {
		sendNotification("Lock In Mode", `${config.duration} minutes starts now.`);
		scheduleEndNotification(config.duration);
	}

	// Schedule auto-end: Claude session fires when time is up
	scheduleLockInEndSession(config.duration);

	// Plain text output for Claude
	console.log(`Lock-in session started (${config.duration} min)`);
	for (const a of actions) console.log(`  - ${a}`);
	console.log(`\nEnds at: ${endsAt.toLocaleTimeString()}`);
	console.log(`Run "openpaw lockin end" when done.`);
}

export function lockInEndCommand(): void {
	const config = readLockInConfig();
	const session = readLockInSession();

	if (!session) {
		console.log("No active lock-in session.");
		return;
	}

	if (config) {
		restoreEnvironment(config, session);
	}

	// Generate receipt
	const startTime = new Date(session.startedAt);
	const elapsed = Math.round((Date.now() - startTime.getTime()) / 60000);
	const stats = getGitDiffStats(session.gitCommitsBefore);

	const commitMessages = getGitCommitMessages(session.gitCommitsBefore);

	console.log("Lock-in session ended.\n");
	console.log("--- Lock In Receipt ---");
	console.log(`Duration:      ${elapsed} min`);
	console.log(`Commits:       ${stats.commits}`);
	console.log(`Lines added:   +${stats.linesAdded}`);
	console.log(`Lines removed: -${stats.linesRemoved}`);
	if (config?.blockedSites) {
		const total = (config.blockedSites.always?.length ?? 0) + (config.blockedSites.askEachTime?.length ?? 0);
		console.log(`Sites blocked: ${total}`);
	}
	if (commitMessages.length > 0) {
		console.log("\nCommits:");
		for (const msg of commitMessages) console.log(`  ${msg}`);
	}
	console.log("-----------------------");

	// Obsidian log
	if (config?.obsidianLog) {
		logToObsidian(elapsed, stats);
		console.log("Logged to Obsidian.");
	}

	// Notification
	if (config?.timer) {
		sendNotification("Lock In Complete", `${elapsed} min session. ${stats.commits} commits.`);
	}

	clearLockInSession();
}

export function lockInStatusCommand(): void {
	const config = readLockInConfig();
	if (!config) {
		console.log("Lock In Mode not configured. Run: openpaw lockin setup");
		return;
	}

	const session = readLockInSession();
	if (!session) {
		console.log("No active lock-in session.");
		console.log(`\nConfig: ${config.duration} min sessions`);
		if (config.blockedSites) console.log(`  Sites: ${config.blockedSites.always.length} always, ${config.blockedSites.askEachTime.length} ask-each-time`);
		if (config.quitApps) console.log(`  Apps: ${config.quitApps.always.length} always, ${config.quitApps.askEachTime.length} ask-each-time`);
		if (config.music) console.log(`  Music: ${config.music.source} → ${config.music.query}`);
		if (config.bluetooth) console.log(`  Bluetooth: ${config.bluetooth.device}`);
		if (config.lights) console.log(`  Lights: ${config.lights.room} at ${config.lights.brightness}%`);
		console.log(`\nRun "openpaw lockin start" to begin.`);
		return;
	}

	const endsAt = new Date(session.endsAt);
	const now = new Date();

	if (endsAt > now) {
		const remaining = Math.round((endsAt.getTime() - now.getTime()) / 60000);
		const elapsed = Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 60000);
		console.log(`Lock-in session active.`);
		console.log(`  Elapsed:   ${elapsed} min`);
		console.log(`  Remaining: ${remaining} min`);
		console.log(`  Ends at:   ${endsAt.toLocaleTimeString()}`);
	} else {
		console.log("Lock-in session expired. Run \"openpaw lockin end\" to clean up and see receipt.");
	}
}

function restoreEnvironment(config: LockInConfig, session?: { savedWindowPositions?: string } | null): void {
	if (config.blockedSites && (config.blockedSites.always.length > 0 || config.blockedSites.askEachTime.length > 0)) {
		unblockSites();
		stopRoastServer();
	}
	if (config.dnd) disableDnd();
	if (config.music) stopMusic(config.music.source);
	if (session?.savedWindowPositions) {
		restoreWindows(session.savedWindowPositions);
	}
}

// ── Paw Animation ──

const PAW_FRAMES = ["🐾", "  🐾", "    🐾", "      🐾", "        🐾", "          🐾"];

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

async function pawWalk(label: string): Promise<void> {
	for (const frame of PAW_FRAMES) {
		process.stdout.write(`\r  ${subtle(frame)} ${dim(label)}`);
		await sleep(60);
	}
	process.stdout.write(`\r\x1B[2K`);
	console.log(`  ${accent("🐾")} ${label}`);
}

// ── Lock In Setup ──

export async function lockInSetupCommand(): Promise<void> {
	showMini();
	console.log("");

	// Auto-detect BEFORE entering clack prompts (execSync can mess with terminal raw mode)
	const caps = detectCapabilities();

	const detected: string[] = [];
	if (caps.hasBluetooth) detected.push("Bluetooth");
	if (caps.hasSpotify) detected.push("Spotify");
	if (caps.hasAppleMusic) detected.push("Apple Music");
	if (caps.hasSonos) detected.push("Sonos");
	if (caps.hasHue) detected.push("Hue lights");
	if (caps.hasSlack) detected.push("Slack");
	if (caps.hasObsidian) detected.push("Obsidian");
	if (caps.hasTerminalNotifier) detected.push("Notifications");

	p.intro(accent("Lock In Mode Setup"));

	if (lockInConfigExists()) {
		const existing = readLockInConfig()!;
		p.log.info("You already have a lock-in config. This will update it.");
		printConfig(existing);
		console.log("");
	}

	if (detected.length > 0) {
		await pawWalk("Sniffing your system...");
		p.log.info(`Detected: ${detected.map((d) => accent(d)).join(", ")}`);
	}

	// ── Duration ──
	const duration = await p.text({
		message: "How long is your typical lock-in session? (minutes)",
		initialValue: "90",
		validate: (v) => {
			const n = parseInt(v, 10);
			return isNaN(n) || n < 5 || n > 480 ? "Enter 5–480 minutes" : undefined;
		},
	});
	if (p.isCancel(duration)) return;

	const config: LockInConfig = {
		duration: parseInt(duration as string, 10),
		dnd: false,
		slackDnd: false,
		timer: false,
		obsidianLog: false,
	};

	// ── Website Blocking ──
	await pawWalk("Distractions...");
	const wantSites = await p.confirm({
		message: "Block distracting websites when locked in?",
		initialValue: true,
	});

	if (!p.isCancel(wantSites) && wantSites) {
		// Step 1: Pick sites + optional custom entry
		const selectedSites = await p.multiselect({
			message: "Which sites?",
			options: [
				...COMMON_BLOCKED_SITES.map((s) => ({ value: s, label: s })),
				{ value: "_custom", label: "Custom...", hint: "type your own" },
			],
			required: false,
		});

		const raw = p.isCancel(selectedSites) ? [] : (selectedSites as string[]);
		const hasCustom = raw.includes("_custom");
		const siteList = raw.filter((s) => s !== "_custom");

		// Step 2: Custom input only if they selected "Custom..."
		if (hasCustom) {
			const customSites = await p.text({
				message: "Type sites to block (comma-separated)",
				defaultValue: "",
			});
			if (!p.isCancel(customSites) && (customSites as string).trim()) {
				siteList.push(...(customSites as string).split(",").map((s) => s.trim()).filter(Boolean));
			}
		}

		// Step 3: Which of those should ask each time?
		if (siteList.length > 0) {
			const askEach = await p.multiselect({
				message: "Any of these you sometimes need? (they'll ask each session)",
				options: siteList.map((s) => ({ value: s, label: s })),
				required: false,
			});

			const askList = p.isCancel(askEach) ? [] : (askEach as string[]);
			const alwaysList = siteList.filter((s) => !askList.includes(s));
			config.blockedSites = { always: alwaysList, askEachTime: askList };
		}
	}

	// ── App Quitting ──
	await pawWalk("Apps...");
	const wantApps = await p.confirm({
		message: "Quit distracting apps when locked in?",
		initialValue: true,
	});

	if (!p.isCancel(wantApps) && wantApps) {
		const appOptions = [...new Set([...COMMON_QUIT_APPS, ...caps.runningApps.filter((a) => !["Finder", "loginwindow", "SystemUIServer", "Dock", "WindowServer"].includes(a))])];

		// Step 1: Pick which apps to quit
		const selectedApps = await p.multiselect({
			message: "Which apps?",
			options: appOptions.slice(0, 15).map((a) => ({
				value: a,
				label: a,
				hint: caps.runningApps.includes(a) ? "running" : undefined,
			})),
			required: false,
		});

		const appList = p.isCancel(selectedApps) ? [] : (selectedApps as string[]);

		// Step 2: Which of those should ask each time?
		if (appList.length > 0) {
			const askEach = await p.multiselect({
				message: "Any of these you sometimes need?",
				options: appList.map((a) => ({ value: a, label: a })),
				required: false,
			});

			const askList = p.isCancel(askEach) ? [] : (askEach as string[]);
			const alwaysList = appList.filter((a) => !askList.includes(a));
			config.quitApps = { always: alwaysList, askEachTime: askList };
		}
	}

	// ── Bluetooth ──
	if (caps.hasBluetooth && caps.bluetoothDevices.length > 0) {
		await pawWalk("Bluetooth...");
		const wantBt = await p.confirm({
			message: "Auto-connect a Bluetooth device (headphones)?",
			initialValue: true,
		});

		if (!p.isCancel(wantBt) && wantBt) {
			const device = await p.select({
				message: "Which device?",
				options: [
					...caps.bluetoothDevices.map((d) => ({ value: d, label: d })),
					{ value: "_custom", label: "Type a name..." },
				],
			});

			if (!p.isCancel(device)) {
				let deviceName = device as string;
				if (deviceName === "_custom") {
					const custom = await p.text({ message: "Device name" });
					if (!p.isCancel(custom)) deviceName = custom as string;
				}
				if (deviceName !== "_custom") {
					config.bluetooth = { device: deviceName };
				}
			}
		}
	}

	// ── Music ──
	await pawWalk("Vibes...");
	const musicSources: { value: LockInMusicSource; label: string; hint?: string }[] = [];
	if (caps.hasSpotify) musicSources.push({ value: "spotify", label: "Spotify", hint: "spogo" });
	if (caps.hasAppleMusic) musicSources.push({ value: "apple-music", label: "Apple Music" });
	if (caps.hasSonos) musicSources.push({ value: "sonos", label: "Sonos" });
	if (caps.hasYtDlp) musicSources.push({ value: "youtube", label: "YouTube (audio)", hint: "yt-dlp" });

	const wantMusic = musicSources.length > 0 ? await p.confirm({
		message: "Play music when locked in?",
		initialValue: true,
	}) : false;

	if (!p.isCancel(wantMusic) && wantMusic) {
		const source = await p.select({
			message: "Music source",
			options: musicSources,
		});

		if (!p.isCancel(source)) {
			const presets: Record<string, { value: string; label: string }[]> = {
				spotify: [
					{ value: "lo-fi beats", label: "Lo-fi beats" },
					{ value: "deep focus", label: "Deep focus" },
					{ value: "white noise", label: "White noise" },
					{ value: "nature sounds", label: "Nature sounds" },
					{ value: "classical focus", label: "Classical" },
					{ value: "_custom", label: "Custom..." },
				],
				"apple-music": [
					{ value: "Focus", label: "Focus" },
					{ value: "Chill", label: "Chill" },
					{ value: "Classical", label: "Classical" },
					{ value: "_custom", label: "Custom..." },
				],
				sonos: [
					{ value: "_custom", label: "Type a playlist or station..." },
				],
				youtube: [
					{ value: "white noise 1 hour", label: "White noise" },
					{ value: "nature sounds rain", label: "Rain sounds" },
					{ value: "waterfall ambient", label: "Waterfall" },
					{ value: "lo-fi hip hop radio", label: "Lo-fi hip hop" },
					{ value: "brown noise focus", label: "Brown noise" },
					{ value: "_custom", label: "Custom URL..." },
				],
			};

			const sourcePresets = presets[source as string] ?? [{ value: "_custom", label: "Custom..." }];

			let query: string | undefined;

			if (sourcePresets.length === 1 && sourcePresets[0].value === "_custom") {
				// Only custom option — go straight to text input
				const custom = await p.text({
					message: "Playlist or station name",
					defaultValue: "",
				});
				if (!p.isCancel(custom) && (custom as string).trim()) query = custom as string;
			} else {
				const picked = await p.select({
					message: "What to play?",
					options: sourcePresets,
				});

				if (!p.isCancel(picked)) {
					if (picked === "_custom") {
						const custom = await p.text({
							message: source === "youtube" ? "YouTube search or URL" : "Playlist or search query",
							defaultValue: "",
						});
						if (!p.isCancel(custom) && (custom as string).trim()) query = custom as string;
					} else {
						query = picked as string;
					}
				}
			}

			if (query) {
				config.music = { source: source as LockInMusicSource, query };
			}
		}
	}

	// ── Lights ──
	if (caps.hasHue) {
		await pawWalk("Lights...");
		const wantLights = await p.confirm({
			message: "Set Hue lights when locked in?",
			initialValue: true,
		});

		if (!p.isCancel(wantLights) && wantLights) {
			let room = "Office";
			if (caps.hueRooms.length > 0) {
				const selected = await p.select({
					message: "Which room?",
					options: [
						...caps.hueRooms.map((r) => ({ value: r, label: r })),
						{ value: "_custom", label: "Type a name..." },
					],
				});
				if (!p.isCancel(selected)) {
					room = selected as string;
					if (room === "_custom") {
						const custom = await p.text({ message: "Room name" });
						if (!p.isCancel(custom)) room = custom as string;
					}
				}
			}

			const brightnessVal = await p.text({
				message: "Brightness (0-100)",
				initialValue: "30",
				validate: (v) => {
					const n = parseInt(v, 10);
					return isNaN(n) || n < 0 || n > 100 ? "Enter 0-100" : undefined;
				},
			});

			if (!p.isCancel(brightnessVal)) {
				config.lights = { room, brightness: parseInt(brightnessVal as string, 10) };

				const color = await p.select({
					message: "Light color",
					options: [
						{ value: "", label: "No preference", hint: "keep current" },
						{ value: "warm", label: "Warm", hint: "relaxed, cozy" },
						{ value: "cool", label: "Cool", hint: "bright, alert" },
						{ value: "red", label: "Red", hint: "low stimulation" },
						{ value: "orange", label: "Orange", hint: "sunset vibe" },
						{ value: "blue", label: "Blue", hint: "calm focus" },
					],
				});
				if (!p.isCancel(color) && color) {
					config.lights.color = color as string;
				}
			}
		}
	}

	// ── DND / Slack / Extras ──
	await pawWalk("Finishing up...");
	const toggles = await p.multiselect({
		message: "Enable when locked in",
		options: [
			{ value: "dnd", label: "macOS Do Not Disturb", hint: "silence all notifications" },
			...(caps.hasSlack ? [{ value: "slackDnd", label: "Slack DND", hint: `auto-set for ${config.duration} min` }] : []),
			...(caps.hasTerminalNotifier ? [{ value: "timer", label: "Timer notification", hint: "notify when session ends" }] : []),
			...(caps.hasObsidian ? [{ value: "obsidianLog", label: "Log to Obsidian", hint: "save session receipt" }] : []),
		],
		required: false,
	});

	if (!p.isCancel(toggles)) {
		const selected = toggles as string[];
		config.dnd = selected.includes("dnd");
		config.slackDnd = selected.includes("slackDnd");
		config.timer = selected.includes("timer");
		config.obsidianLog = selected.includes("obsidianLog");
	}

	// ── Skills Directory ──
	const defaultDir = getDefaultSkillsDir();
	const installed = listInstalledSkills(defaultDir);
	const hint = installed.length > 0 ? `${installed.length} skills installed here` : "recommended";

	const skillsDir = await p.select({
		message: "Where should the lock-in skill live?",
		options: [
			{ value: defaultDir, label: `Global ${dim("~/.claude/skills/")}`, hint },
			{ value: ".claude/skills", label: `Project ${dim(".claude/skills/")}` },
			{ value: "custom", label: "Custom path" },
		],
	});

	let targetDir = p.isCancel(skillsDir) ? defaultDir : (skillsDir as string);
	if (targetDir === "custom") {
		const customDir = await p.text({
			message: "Skills directory path:",
			defaultValue: "",
			validate: (v) => (v.length === 0 ? "Path cannot be empty" : undefined),
		});
		if (p.isCancel(customDir)) {
			targetDir = defaultDir;
		} else {
			targetDir = (customDir as string).replace(/^~/, os.homedir());
		}
	}

	// ── Save ──
	await pawWalk("Saving your lock-in config...");
	writeLockInConfig(config);
	installLockInSkillMd(targetDir);

	console.log("");
	printConfig(config);
	p.outro(accent("Lock In Mode configured! ") + dim('Tell Claude to "lock in" to start a session. 🐾'));
}

// ── Install SKILL.md ──

function installLockInSkillMd(skillsDir: string): void {
	const skillDir = path.join(skillsDir, "c-lockin");
	fs.mkdirSync(skillDir, { recursive: true });

	const md = `---
name: c-lockin
description: Lock In Mode — orchestrate distraction blocking, environment setup, and session tracking.
tags: [lockin, focus, productivity, deep-work, pomodoro, distraction-blocking]
---

## What This Skill Does

You orchestrate lock-in sessions using the \`openpaw lockin\` CLI.

IMPORTANT: Always use \`openpaw lockin start\` to begin a session. Never run site-blocking or admin commands individually — they require macOS admin privileges that only work through the CLI.

## Config

Read \`~/.config/openpaw/lockin.json\` for preferences. If missing, suggest: \`openpaw lockin setup\`

## Starting a Lock In Session

When the user says "lock in", "focus", "deep work", or similar:

1. Check \`~/.config/openpaw/lockin-session.json\` — if it exists, a session is already active
2. If there are \`askEachTime\` sites or apps, ask the user which to include this session
3. Tell the user what you're about to do, then run:

\`\`\`bash
openpaw lockin start        # Start with "always" sites/apps only
openpaw lockin start --all  # Include all ask-each-time sites/apps too
\`\`\`

This single command handles everything:
- Blocks configured websites (with a custom roast page on blocked sites)
- Quits distracting apps
- Connects Bluetooth devices
- Plays music
- Sets smart lights
- Enables macOS DND and Slack DND
- Centers the active app and minimizes other windows
- Saves window positions for later restore
- Starts auto-end timer (sends summary via Telegram when done)

## Ending a Lock In Session

When the user says "stop", "end session", "I'm done", or the timer fires:

\`\`\`bash
openpaw lockin end
\`\`\`

This restores everything and prints a receipt with:
- Session duration
- Git commits made (with commit messages)
- Lines added/removed
- Blocked site attempt count

## Other Commands

\`\`\`bash
openpaw lockin status     # Check if a session is active
openpaw lockin setup      # Interactive setup wizard
openpaw lockin configure  # Alias for setup
\`\`\`

## Guidelines

- Only start a session when the user explicitly asks — never suggest unprompted
- Always tell the user what you're about to do before running start
- Reference SOUL.md for personal preferences
- When ending, write a human summary — don't just dump numbers
- Include commit messages in the summary to highlight what they accomplished
`;

	fs.writeFileSync(path.join(skillDir, "SKILL.md"), md);
}

// ── Lock In Configure (alias to setup) ──

export async function lockInConfigureCommand(): Promise<void> {
	return lockInSetupCommand();
}

// ── Helpers ──

function printConfig(config: LockInConfig): void {
	const lines: string[] = [];
	lines.push(`${bold("Duration:")}      ${config.duration} min`);

	if (config.blockedSites) {
		lines.push(`${bold("Sites:")}         ${config.blockedSites.always.length} always blocked, ${config.blockedSites.askEachTime.length} ask-each-time`);
	}
	if (config.quitApps) {
		lines.push(`${bold("Apps:")}          ${config.quitApps.always.length} always quit, ${config.quitApps.askEachTime.length} ask-each-time`);
	}
	if (config.bluetooth) lines.push(`${bold("Bluetooth:")}     ${config.bluetooth.device}`);
	if (config.music) lines.push(`${bold("Music:")}         ${config.music.source} → ${config.music.query}`);
	if (config.lights) lines.push(`${bold("Lights:")}        ${config.lights.room} at ${config.lights.brightness}%${config.lights.color ? ` (${config.lights.color})` : ""}`);
	lines.push(`${bold("Windows:")}       auto (center active app)`);

	const flags: string[] = [];
	if (config.dnd) flags.push("DND");
	if (config.slackDnd) flags.push("Slack DND");
	if (config.timer) flags.push("Timer");
	if (config.obsidianLog) flags.push("Obsidian log");
	if (flags.length) lines.push(`${bold("Extras:")}        ${flags.join(", ")}`);

	p.note(lines.join("\n"), "Lock In Config");
}
