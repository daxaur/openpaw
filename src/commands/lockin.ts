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
					{ value: "https://www.youtube.com/watch?v=nMfPqeZjc2c", label: "White noise" },
					{ value: "https://www.youtube.com/watch?v=jfKfPfyJRdk", label: "Lo-fi hip hop" },
					{ value: "https://www.youtube.com/watch?v=eKFTSSKCzWA", label: "Rain sounds" },
					{ value: "https://www.youtube.com/watch?v=lSTgq3bSXNI", label: "Waterfall" },
					{ value: "https://www.youtube.com/watch?v=GSaJXDsb3N8", label: "Brown noise" },
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

You run lock-in sessions by reading config and executing commands directly.
Be FAST. Say one short line like "Locking you in for 90 min" then silently execute every step. Don't narrate or explain each step — just run them. Only speak again when done ("Locked in until HH:MM") or if something fails.

Do NOT use \`openpaw lockin start\` or \`openpaw lockin end\` — those don't exist.
CRITICAL: Run each bash command ONE AT A TIME. Never run multiple in parallel.

## Config

Read \`~/.config/openpaw/lockin.json\`. If missing → suggest \`openpaw lockin setup\`

## Starting a Session

When the user says "lock in", "focus", "deep work", etc:

1. Read config + check \`~/.config/openpaw/lockin-session.json\` (if \`endsAt\` is future → already active)
2. If \`askEachTime\` items exist, ask briefly which to include
3. Say ONE line like "Locking you in for 90 min" then execute
4. Calculate \`endsAt\` = now + duration minutes (ISO 8601)
5. Run each step below ONE AT A TIME
6. Write session file
7. Say "Locked in until HH:MM"

### Site Blocking (PAC File)

Only if \`blockedSites\` has entries.

1. Write PAC file (replace SITE_LIST with actual quoted domains like \`"x.com","reddit.com"\`):

\`\`\`bash
cat > /tmp/lockin-block.pac << 'PACEOF'
function FindProxyForURL(url, host) {
  var blocked = [SITE_LIST];
  for (var i = 0; i < blocked.length; i++) {
    if (dnsDomainIs(host, blocked[i]) || dnsDomainIs(host, "www." + blocked[i])) {
      return "PROXY 127.0.0.1:1";
    }
  }
  return "DIRECT";
}
PACEOF
\`\`\`

2. Start PAC server:

\`\`\`bash
python3 -m http.server 9777 --directory /tmp &>/dev/null &
\`\`\`

3. Set auto-proxy on ALL network services (handles Wi-Fi, Ethernet, any connection):

\`\`\`bash
sleep 1 && networksetup -listallnetworkservices | tail -n +2 | while IFS= read -r svc; do networksetup -setautoproxyurl "$svc" "http://127.0.0.1:9777/lockin-block.pac" 2>/dev/null; done
\`\`\`

4. Disable Chrome incognito to prevent bypass:

\`\`\`bash
defaults write com.google.Chrome IncognitoModeAvailability -integer 1
\`\`\`

### Quit Apps

Only if \`quitApps\` has entries. For each app:

\`\`\`bash
osascript -e 'quit app "APP_NAME"'
\`\`\`

### Bluetooth

Only if \`bluetooth.device\` is set:

\`\`\`bash
blu connect "DEVICE_NAME"
\`\`\`

### Music

Only if \`music\` is set. Based on \`music.source\`:

- **youtube**: \`open "URL"\` (the config stores a YouTube URL — just open it in the browser)
- **spotify**: \`spogo play "QUERY"\`
- **apple-music**: \`osascript -e 'tell application "Music" to play (first playlist whose name contains "QUERY")'\`
- **sonos**: \`sonos play "QUERY"\`

### Lights

Only if \`lights\` is set:

\`\`\`bash
openhue set room "ROOM" --on --brightness BRIGHTNESS
\`\`\`

If \`lights.color\` is set, add \`--color "COLOR"\`.
If openhue fails with a connection error, tell user: "Run \`openhue setup\` to pair with your Hue bridge."

### Do Not Disturb

Only if \`dnd\` is true:

\`\`\`bash
shortcuts run "Set Focus" 2>/dev/null || defaults -currentHost write com.apple.notificationcenterui doNotDisturb -boolean true && killall NotificationCenter 2>/dev/null
\`\`\`

### Slack DND

Only if \`slackDnd\` is true:

\`\`\`bash
slack dnd set DURATION_MINUTES
\`\`\`

### Timer Notification

Only if \`timer\` is true:

\`\`\`bash
(sleep DURATION_SECONDS && terminal-notifier -title "Lock In Complete" -message "Session finished! Time for a break." -sound default) &
\`\`\`

### Window & Timer Setup (do this last)

1. Note the current frontmost app (the user's coding environment):

\`\`\`bash
osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'
\`\`\`

Save this app name — you'll need it in step 5.

2. Center the coding app at ~80% screen:

\`\`\`bash
osascript << 'ASCRIPT'
tell application "Finder"
    set {x1, y1, x2, y2} to bounds of window of desktop
end tell
set sw to x2 - x1
set sh to y2 - y1
set w to (sw * 0.8) as integer
set h to (sh - 100) as integer
set xPos to ((sw - w) / 2) as integer
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
end tell
tell application frontApp
    set bounds of front window to {xPos, 50, xPos + w, 50 + h}
end tell
ASCRIPT
\`\`\`

3. Start dashboard if not running, then open focus timer:

\`\`\`bash
curl -s -o /dev/null http://localhost:3141 2>/dev/null || nohup openpaw dashboard --no-open &>/dev/null &
\`\`\`

\`\`\`bash
sleep 1 && open "http://localhost:3141/focus?ends=ENDS_AT_ISO8601&duration=DURATION_MIN"
\`\`\`

4. Position timer window top-left:

\`\`\`bash
sleep 2 && osascript << 'ASCRIPT'
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
end tell
tell application frontApp
    set bounds of front window to {0, 25, 400, 325}
end tell
ASCRIPT
\`\`\`

5. Bring the coding app back to front (use the app name from step 1):

\`\`\`bash
osascript -e 'tell application "SAVED_APP_NAME" to activate'
\`\`\`

6. Minimize everything else:

\`\`\`bash
osascript << 'ASCRIPT'
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
    repeat with proc in (every process whose visible is true and name is not frontApp and name is not "Finder")
        try
            click (first button of (first window of proc) whose subrole is "AXMinimizeButton")
        end try
    end repeat
end tell
ASCRIPT
\`\`\`

### Session File

Write \`~/.config/openpaw/lockin-session.json\`:

\`\`\`json
{
  "startedAt": "ISO_TIMESTAMP",
  "endsAt": "ISO_TIMESTAMP",
  "config": { ... },
  "blockedSiteAttempts": 0,
  "gitCommitsBefore": GIT_COMMIT_COUNT
}
\`\`\`

Get git commit count: \`git rev-list --count HEAD 2>/dev/null || echo 0\`

## Ending a Session

When the user says "stop", "end session", "I'm done":

Run each step ONE AT A TIME:

1. **Remove site blocking** — disable proxy on all network services:

\`\`\`bash
networksetup -listallnetworkservices | tail -n +2 | while IFS= read -r svc; do networksetup -setautoproxystate "$svc" off 2>/dev/null; done
\`\`\`

\`\`\`bash
pkill -f "python3 -m http.server 9777" 2>/dev/null; rm -f /tmp/lockin-block.pac
\`\`\`

\`\`\`bash
defaults delete com.google.Chrome IncognitoModeAvailability 2>/dev/null
\`\`\`

2. **Disable DND**: \`defaults -currentHost write com.apple.notificationcenterui doNotDisturb -boolean false && killall NotificationCenter 2>/dev/null\`

3. **Stop music**: \`osascript -e 'tell application "Music" to pause' 2>/dev/null; osascript -e 'tell application "Spotify" to pause' 2>/dev/null\`

4. **Git receipt**:

\`\`\`bash
git log --oneline --after="STARTED_AT" 2>/dev/null
\`\`\`

\`\`\`bash
git diff --stat HEAD~N 2>/dev/null
\`\`\`

5. **Obsidian log** (if \`obsidianLog\`): \`obsidian-cli append daily "## Lock In Session\\n- Duration: X min\\n- Commits: N\\n..."\`
6. **Delete session file**: \`rm ~/.config/openpaw/lockin-session.json\`
7. **Brief warm summary**: duration, commits + messages, lines changed, encouraging note referencing SOUL.md personality

## Reconfigure

\`\`\`bash
openpaw lockin setup
\`\`\`

## Guidelines

- Be FAST — one line to start, execute silently, one line when done
- Never explain or narrate each step before running it — just do it
- Run steps ONE AT A TIME — never parallel
- If a step fails, mention it briefly and move on
- Skip steps whose config field is missing or false
- Only start when the user explicitly asks
- Reference SOUL.md for personality in summaries
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
