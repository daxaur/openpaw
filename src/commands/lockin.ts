import * as p from "@clack/prompts";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import { showMini, accent, dim, bold, subtle } from "../core/branding.js";
import { getDefaultSkillsDir, listInstalledSkills } from "../core/skills.js";
import {
	readLockInConfig,
	writeLockInConfig,
	lockInConfigExists,
	detectCapabilities,
	readLockInSession,
	generateStartScript,
	generateEndScript,
	COMMON_BLOCKED_SITES,
	COMMON_QUIT_APPS,
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
			p.log.info(dim("Claude is managing this session. Tell Claude to end it."));
			return;
		}
		// Session expired
		p.log.warn("Previous session expired. Tell Claude to clean up, or delete ~/.config/openpaw/lockin-session.json");
	}

	// Show config
	printConfig(config);
	console.log("");
	p.log.info(dim("Tell Claude to ") + bold("lock in") + dim(" to start a session."));
	p.log.info(dim("Reconfigure: ") + bold("openpaw lockin setup"));
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
		const selectedSites = await p.multiselect({
			message: "Which sites to block?",
			options: [
				...COMMON_BLOCKED_SITES.map((s) => ({ value: s, label: s })),
				{ value: "_custom", label: "Custom...", hint: "type your own" },
			],
			required: false,
		});

		const raw = p.isCancel(selectedSites) ? [] : (selectedSites as string[]);
		const hasCustom = raw.includes("_custom");
		const siteList = raw.filter((s) => s !== "_custom");

		if (hasCustom) {
			const customSites = await p.text({
				message: "Type sites to block (comma-separated)",
				defaultValue: "",
			});
			if (!p.isCancel(customSites) && (customSites as string).trim()) {
				siteList.push(...(customSites as string).split(",").map((s) => s.trim()).filter(Boolean));
			}
		}

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
			const presets: Record<string, Array<{ value: string; label: string; hint?: string }>> = {
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
					{ value: "https://www.youtube.com/watch?v=nMfPqeZjc2c", label: "White noise", hint: "10h" },
					{ value: "https://www.youtube.com/watch?v=jfKfPfyJRdk", label: "Lo-fi hip hop", hint: "Lofi Girl livestream" },
					{ value: "https://www.youtube.com/watch?v=jX6kn9_U8qk", label: "Rain sounds", hint: "10h" },
					{ value: "https://www.youtube.com/watch?v=jkLRith2wcc", label: "Water/stream sounds", hint: "10h" },
					{ value: "https://www.youtube.com/watch?v=GSaJXDsb3N8", label: "Brown noise", hint: "8h" },
					{ value: "_custom", label: "Custom URL..." },
				],
			};

			const sourcePresets = presets[source as string] ?? [{ value: "_custom", label: "Custom..." }];

			let query: string | undefined;

			if (sourcePresets.length === 1 && sourcePresets[0].value === "_custom") {
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
							message: source === "youtube" ? "YouTube URL" : "Playlist or search query",
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
	await pawWalk("Lights...");
	const wantLights = await p.confirm({
		message: "Set Hue lights when locked in?",
		initialValue: caps.hasHue,
	});

	if (!p.isCancel(wantLights) && wantLights) {
		let hueReady = caps.hasHue;

		if (!hueReady) {
			p.log.warn("openhue CLI is not installed (controls Philips Hue).");
			const installHue = await p.confirm({
				message: "Install via Homebrew? (brew install openhue-cli)",
				initialValue: true,
			});
			if (!p.isCancel(installHue) && installHue) {
				const s = p.spinner();
				s.start("Installing openhue-cli...");
				try {
					execSync("brew install openhue-cli", { stdio: "pipe", timeout: 120000 });
					hueReady = true;
					s.stop(accent("openhue installed!"));
					p.log.info(dim("Pair with your bridge: ") + bold("openhue setup"));
				} catch {
					s.stop("Install failed. Install manually: brew install openhue-cli");
				}
			}
		}

		if (hueReady && caps.hueRooms.length === 0) {
			p.log.info(dim("No Hue rooms found. Run ") + bold("openhue setup") + dim(" to pair with your bridge."));
		}

		if (hueReady || caps.hueRooms.length > 0) {
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
			} else {
				const custom = await p.text({
					message: "Room name",
					initialValue: "Office",
				});
				if (!p.isCancel(custom)) room = custom as string;
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
		} else {
			p.log.info(dim("Skipping lights. Install later: ") + bold("brew install openhue-cli"));
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

export function installLockInSkillMd(skillsDir: string): void {
	const skillDir = path.join(skillsDir, "c-lockin");
	fs.mkdirSync(skillDir, { recursive: true });

	const md = `---
name: c-lockin
description: Lock In Mode — orchestrate distraction blocking, environment setup, and session tracking.
tags: [lockin, focus, productivity, deep-work, pomodoro, distraction-blocking]
---

## Behavior

You run lock-in sessions using generated shell scripts — fast, one command.
Be FAST. Say one short line like "Locking you in for 90 min" then run TWO commands max. Don't narrate steps. Only speak again when done ("Locked in until HH:MM") or if something fails.

## Starting a Session

When the user says "lock in", "focus", "deep work", etc:

1. Read \`~/.config/openpaw/lockin.json\`. If missing → suggest \`openpaw lockin setup\`
2. Check \`~/.config/openpaw/lockin-session.json\` — if \`endsAt\` is in the future, session is already active. Tell the user.
3. If config has \`askEachTime\` sites or apps, ask the user briefly which to include this session
4. Calculate \`endsAt\` = now + duration minutes (ISO 8601 format, e.g. \`2026-03-03T16:30:00.000Z\`)
5. Say ONE short line like "Locking you in for 90 min"
6. Generate scripts + run:

\`\`\`bash
openpaw lockin gen-scripts --ends "ENDS_AT_ISO8601" --extra-sites "site1,site2" --extra-apps "App1,App2"
\`\`\`

Omit \`--extra-sites\` and \`--extra-apps\` if none were chosen from askEachTime.

Then immediately run:

\`\`\`bash
bash /tmp/lockin-start.sh
\`\`\`

7. Say "Locked in until HH:MM"

That's it — TWO bash commands to start a session.

## Ending a Session

When the user says "stop", "end session", "I'm done":

1. Read \`~/.config/openpaw/lockin-session.json\` to get session data
2. Run:

\`\`\`bash
bash /tmp/lockin-end.sh
\`\`\`

3. Read the output for git stats
4. If \`obsidianLog\` is true in config: \`obsidian-cli append daily "## Lock In Session\\n- Duration: X min\\n- Commits: N\\n..."\`
5. Give a brief warm summary: duration, commits + messages, lines changed, encouraging note referencing SOUL.md personality

## Reconfigure

\`\`\`bash
openpaw lockin setup
\`\`\`

## Guidelines

- Be FAST — one line to start, two commands, one line when done
- Never explain or narrate each step — just do it
- If something fails, mention it briefly and move on
- Only start when the user explicitly asks
- Reference SOUL.md for personality in summaries
`;

	fs.writeFileSync(path.join(skillDir, "SKILL.md"), md);
}

// ── Generate Scripts ──

export function lockInGenScriptsCommand(opts: {
	ends: string;
	extraSites?: string;
	extraApps?: string;
}): void {
	const config = readLockInConfig();
	if (!config) {
		console.error("No lock-in config found. Run: openpaw lockin setup");
		process.exit(1);
	}

	const extraSites = opts.extraSites
		? opts.extraSites.split(",").map((s) => s.trim()).filter(Boolean)
		: [];
	const extraApps = opts.extraApps
		? opts.extraApps.split(",").map((s) => s.trim()).filter(Boolean)
		: [];

	const startScript = generateStartScript({
		config,
		endsAt: opts.ends,
		extraSites,
		extraApps,
	});

	const endScript = generateEndScript(config);

	fs.writeFileSync("/tmp/lockin-start.sh", startScript, { mode: 0o755 });
	fs.writeFileSync("/tmp/lockin-end.sh", endScript, { mode: 0o755 });

	console.log("/tmp/lockin-start.sh");
	console.log("/tmp/lockin-end.sh");
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

	const flags: string[] = [];
	if (config.dnd) flags.push("DND");
	if (config.slackDnd) flags.push("Slack DND");
	if (config.timer) flags.push("Timer");
	if (config.obsidianLog) flags.push("Obsidian log");
	if (flags.length) lines.push(`${bold("Extras:")}        ${flags.join(", ")}`);

	p.note(lines.join("\n"), "Lock In Config");
}
