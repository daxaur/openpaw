import * as p from "@clack/prompts";
import chalk from "chalk";
import { showMini, accent, dim, bold } from "../core/branding.js";
import {
	readFocusConfig,
	writeFocusConfig,
	focusConfigExists,
	detectCapabilities,
	readFocusSession,
	writeFocusSession,
	clearFocusSession,
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
} from "../core/focus.js";
import type { FocusConfig, FocusMusicSource } from "../types.js";

// ── Focus Start ──

export async function focusCommand(): Promise<void> {
	showMini();
	console.log("");

	const config = readFocusConfig();
	if (!config) {
		p.log.warn("Focus Mode isn't set up yet.");
		p.log.info(`Run ${bold("openpaw focus setup")} to configure your focus environment.`);
		return;
	}

	// Check for active session
	const existing = readFocusSession();
	if (existing) {
		const endsAt = new Date(existing.endsAt);
		const now = new Date();
		if (endsAt > now) {
			const remaining = Math.round((endsAt.getTime() - now.getTime()) / 60000);
			p.log.info(`Focus session active — ${bold(remaining + " min")} remaining.`);
			const action = await p.select({
				message: "What do you want to do?",
				options: [
					{ value: "status", label: "Keep going", hint: "close this and get back to work" },
					{ value: "end", label: "End session early", hint: "restore everything + show receipt" },
				],
			});
			if (p.isCancel(action) || action === "status") {
				p.outro(dim("Stay focused!"));
				return;
			}
			await endFocusSession(config, existing);
			return;
		}
		// Session expired — clean up
		await endFocusSession(config, existing);
		return;
	}

	// Show current config
	printConfig(config);

	const confirm = await p.confirm({
		message: `Start ${bold(config.duration + "-minute")} focus session?`,
		initialValue: true,
	});

	if (p.isCancel(confirm) || !confirm) {
		p.outro(dim("Maybe later."));
		return;
	}

	// Ask about "ask each time" items
	let sitesToBlock = [...(config.blockedSites?.always ?? [])];
	if (config.blockedSites?.askEachTime?.length) {
		const extraSites = await p.multiselect({
			message: "Block these sites too this session?",
			options: config.blockedSites.askEachTime.map((s) => ({
				value: s,
				label: s,
			})),
			required: false,
		});
		if (!p.isCancel(extraSites)) {
			sitesToBlock = [...sitesToBlock, ...(extraSites as string[])];
		}
	}

	let appsToQuit = [...(config.quitApps?.always ?? [])];
	if (config.quitApps?.askEachTime?.length) {
		const extraApps = await p.multiselect({
			message: "Quit these apps too this session?",
			options: config.quitApps.askEachTime.map((a) => ({
				value: a,
				label: a,
			})),
			required: false,
		});
		if (!p.isCancel(extraApps)) {
			appsToQuit = [...appsToQuit, ...(extraApps as string[])];
		}
	}

	// ── Execute focus sequence ──
	const s = p.spinner();
	s.start("Entering focus mode...");

	// 1. Block sites
	if (sitesToBlock.length > 0) {
		s.message(`Blocking ${sitesToBlock.length} sites...`);
		blockSites(sitesToBlock);
	}

	// 2. Quit apps
	if (appsToQuit.length > 0) {
		s.message(`Quitting ${appsToQuit.length} apps...`);
		quitApps(appsToQuit);
	}

	// 3. Bluetooth
	if (config.bluetooth?.device) {
		s.message(`Connecting ${config.bluetooth.device}...`);
		connectBluetooth(config.bluetooth.device);
	}

	// 4. Music
	if (config.music) {
		s.message(`Starting ${config.music.source} music...`);
		startMusic(config.music);
	}

	// 5. Lights
	if (config.lights) {
		s.message(`Setting ${config.lights.room} lights...`);
		setLights(config.lights.room, config.lights.brightness, config.lights.color);
	}

	// 6. DND
	if (config.dnd) {
		s.message("Enabling Do Not Disturb...");
		enableDnd();
	}

	// 7. Slack DND
	if (config.slackDnd) {
		s.message("Setting Slack to DND...");
		enableSlackDnd(config.duration);
	}

	s.stop("Focus mode active!");

	// Save session
	const now = new Date();
	const session = {
		startedAt: now.toISOString(),
		endsAt: new Date(now.getTime() + config.duration * 60000).toISOString(),
		config,
		blockedSiteAttempts: 0,
		gitCommitsBefore: getGitCommitCount(),
	};
	writeFocusSession(session);

	// Timer notification
	if (config.timer) {
		sendNotification("Focus Mode", `${config.duration} minutes starts now. Get after it.`);
	}

	console.log("");
	p.log.success(`${bold(config.duration + " minutes")} of focus. Go build something great.`);
	p.log.info(`Run ${accent("openpaw focus")} to end early or check status.`);
	p.outro(dim("Distractions eliminated."));
}

async function endFocusSession(config: FocusConfig, session: { startedAt: string; gitCommitsBefore: number }): Promise<void> {
	const s = p.spinner();
	s.start("Restoring environment...");

	// Unblock sites
	if (config.blockedSites && (config.blockedSites.always.length > 0 || config.blockedSites.askEachTime.length > 0)) {
		s.message("Unblocking sites...");
		unblockSites();
	}

	// Disable DND
	if (config.dnd) {
		s.message("Disabling Do Not Disturb...");
		disableDnd();
	}

	// Stop music
	if (config.music) {
		s.message("Stopping music...");
		stopMusic(config.music.source);
	}

	s.stop("Environment restored.");

	// ── Focus Receipt ──
	const startTime = new Date(session.startedAt);
	const elapsed = Math.round((Date.now() - startTime.getTime()) / 60000);
	const stats = getGitDiffStats(session.gitCommitsBefore);

	const receipt: string[] = [
		`${bold("Duration:")}     ${elapsed} min`,
		`${bold("Commits:")}      ${stats.commits}`,
		`${bold("Lines:")}        ${chalk.green("+" + stats.linesAdded)} / ${chalk.red("-" + stats.linesRemoved)}`,
	];

	if (config.blockedSites) {
		const total = (config.blockedSites.always?.length ?? 0) + (config.blockedSites.askEachTime?.length ?? 0);
		receipt.push(`${bold("Sites blocked:")} ${total}`);
	}

	console.log("");
	p.note(receipt.join("\n"), "Focus Receipt");

	// Obsidian log
	if (config.obsidianLog) {
		logToObsidian(elapsed, stats);
		p.log.info(dim("Logged to Obsidian."));
	}

	// Telegram notify
	if (config.telegramNotify) {
		sendNotification("Focus Complete", `${elapsed} min session done. ${stats.commits} commits, +${stats.linesAdded}/-${stats.linesRemoved} lines.`);
	}

	// Timer notification
	if (config.timer) {
		sendNotification("Focus Session Complete", `${elapsed} minutes of focus. ${stats.commits} commits.`);
	}

	clearFocusSession();
	p.outro(dim("Focus session complete. Nice work."));
}

// ── Focus Setup ──

export async function focusSetupCommand(): Promise<void> {
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

	p.intro(accent("Focus Mode Setup"));

	if (focusConfigExists()) {
		const existing = readFocusConfig()!;
		p.log.info("You already have a focus config. This will update it.");
		printConfig(existing);
		console.log("");
	}

	if (detected.length > 0) {
		p.log.info(`Detected: ${detected.map((d) => accent(d)).join(", ")}`);
	}

	// ── Duration ──
	const duration = await p.text({
		message: "How long is your typical focus session? (minutes)",
		initialValue: "90",
		validate: (v) => {
			const n = parseInt(v, 10);
			return isNaN(n) || n < 5 || n > 480 ? "Enter 5–480 minutes" : undefined;
		},
	});
	if (p.isCancel(duration)) return;

	const config: FocusConfig = {
		duration: parseInt(duration as string, 10),
		dnd: false,
		slackDnd: false,
		calendarBlock: false,
		timer: false,
		obsidianLog: false,
		telegramNotify: false,
	};

	// ── Website Blocking ──
	const wantSites = await p.confirm({
		message: "Block distracting websites during focus?",
		initialValue: true,
	});

	if (!p.isCancel(wantSites) && wantSites) {
		// Step 1: Pick which sites to block
		const selectedSites = await p.multiselect({
			message: "Which sites?",
			options: COMMON_BLOCKED_SITES.map((s) => ({ value: s, label: s })),
			required: false,
		});

		const siteList = p.isCancel(selectedSites) ? [] : (selectedSites as string[]);

		// Step 2: Add custom sites
		const customSites = await p.text({
			message: "Any others? (comma-separated, enter to skip)",
			defaultValue: "",
		});
		if (!p.isCancel(customSites) && (customSites as string).trim()) {
			siteList.push(...(customSites as string).split(",").map((s) => s.trim()).filter(Boolean));
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
	const wantApps = await p.confirm({
		message: "Quit distracting apps when focus starts?",
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
	const musicSources: { value: FocusMusicSource; label: string; hint?: string }[] = [];
	if (caps.hasSpotify) musicSources.push({ value: "spotify", label: "Spotify", hint: "spogo" });
	if (caps.hasAppleMusic) musicSources.push({ value: "apple-music", label: "Apple Music" });
	if (caps.hasSonos) musicSources.push({ value: "sonos", label: "Sonos" });
	if (caps.hasYtDlp) musicSources.push({ value: "youtube", label: "YouTube (audio)", hint: "yt-dlp" });

	const wantMusic = musicSources.length > 0 ? await p.confirm({
		message: "Play music when focus starts?",
		initialValue: true,
	}) : false;

	if (!p.isCancel(wantMusic) && wantMusic) {
		const source = await p.select({
			message: "Music source",
			options: musicSources,
		});

		if (!p.isCancel(source)) {
			const placeholders: Record<string, string> = {
				spotify: "lo-fi beats",
				"apple-music": "Focus",
				sonos: "playlist name",
				youtube: "https://youtube.com/watch?v=...",
				url: "https://...",
				local: "/path/to/file.mp3",
			};

			const query = await p.text({
				message: source === "spotify" ? "Playlist or search query" : source === "apple-music" ? "Playlist name" : "URL or path",
				placeholder: placeholders[source as string] ?? "",
			});

			if (!p.isCancel(query)) {
				config.music = { source: source as FocusMusicSource, query: query as string };
			}
		}
	}

	// ── Lights ──
	if (caps.hasHue) {
		const wantLights = await p.confirm({
			message: "Set Hue lights for focus?",
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

				const color = await p.text({
					message: "Color? (warm, cool, red, etc — or skip)",
					placeholder: "warm",
				});
				if (!p.isCancel(color) && (color as string).trim()) {
					config.lights.color = (color as string).trim();
				}
			}
		}
	}

	// ── DND / Slack / Calendar ──
	const toggles = await p.multiselect({
		message: "Enable during focus",
		options: [
			{ value: "dnd", label: "macOS Do Not Disturb", hint: "silence all notifications" },
			...(caps.hasSlack ? [{ value: "slackDnd", label: "Slack DND", hint: `auto-set for ${config.duration} min` }] : []),
			{ value: "calendarBlock", label: "Calendar block", hint: "create a busy event" },
			{ value: "timer", label: "Timer notification", hint: "notify when session ends" },
			...(caps.hasObsidian ? [{ value: "obsidianLog", label: "Log to Obsidian", hint: "save focus receipt" }] : []),
			...(caps.hasTelegram ? [{ value: "telegramNotify", label: "Telegram notification", hint: "send receipt via Telegram" }] : []),
		],
		required: false,
	});

	if (!p.isCancel(toggles)) {
		const selected = toggles as string[];
		config.dnd = selected.includes("dnd");
		config.slackDnd = selected.includes("slackDnd");
		config.calendarBlock = selected.includes("calendarBlock");
		config.timer = selected.includes("timer");
		config.obsidianLog = selected.includes("obsidianLog");
		config.telegramNotify = selected.includes("telegramNotify");
	}

	// ── Save ──
	writeFocusConfig(config);

	console.log("");
	printConfig(config);
	p.outro(accent("Focus Mode configured!") + dim(" Run ") + bold("openpaw focus") + dim(" to start."));
}

// ── Focus Configure (alias to setup) ──

export async function focusConfigureCommand(): Promise<void> {
	return focusSetupCommand();
}

// ── Helpers ──

function printConfig(config: FocusConfig): void {
	const lines: string[] = [];
	lines.push(`${bold("Duration:")}      ${config.duration} min`);

	if (config.blockedSites) {
		const total = config.blockedSites.always.length + config.blockedSites.askEachTime.length;
		lines.push(`${bold("Sites:")}         ${config.blockedSites.always.length} always blocked, ${config.blockedSites.askEachTime.length} ask-each-time`);
	}
	if (config.quitApps) {
		lines.push(`${bold("Apps:")}          ${config.quitApps.always.length} always quit, ${config.quitApps.askEachTime.length} ask-each-time`);
	}
	if (config.bluetooth) lines.push(`${bold("Bluetooth:")}     ${config.bluetooth.device}`);
	if (config.music) lines.push(`${bold("Music:")}         ${config.music.source} → ${config.music.query}`);
	if (config.lights) lines.push(`${bold("Lights:")}        ${config.lights.room} at ${config.lights.brightness}%${config.lights.color ? ` (${config.lights.color})` : ""}`);

	const flags: string[] = [];
	if (config.dnd) flags.push("DND");
	if (config.slackDnd) flags.push("Slack DND");
	if (config.calendarBlock) flags.push("Cal block");
	if (config.timer) flags.push("Timer");
	if (config.obsidianLog) flags.push("Obsidian log");
	if (config.telegramNotify) flags.push("Telegram");
	if (flags.length) lines.push(`${bold("Extras:")}        ${flags.join(", ")}`);

	p.note(lines.join("\n"), "Focus Config");
}
