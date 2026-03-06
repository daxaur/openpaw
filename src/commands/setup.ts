import * as p from "@clack/prompts";
import * as os from "node:os";
import chalk from "chalk";
import { execSync } from "node:child_process";
import { skills, categoryLabels, getSkillsByCategory, getPresetSkills, presets, getAllTaps, getSkillById } from "../catalog/index.js";
import { detectPlatform } from "../core/platform.js";
import { showBanner, pawStep, pawPulse, showPuppyDisclaimer, accent, subtle, dim, bold } from "../core/branding.js";
import { installTaps, getMissingTools, installTool } from "../core/installer.js";
import { installSkill, getDefaultSkillsDir, listInstalledSkills } from "../core/skills.js";
import { addPermissions } from "../core/permissions.js";
import { installSafetyHooks } from "../core/hooks.js";
import { soulQuestionnaire, writeSoul, showSoulSummary, soulExists } from "../core/soul.js";
import { setupMemory } from "../core/memory.js";
import { telegramQuestionnaire, writeTelegramConfig, telegramConfigExists } from "../core/telegram.js";
import { isTmuxAvailable, isInTmux, launchInTmux, launchInBackground } from "../core/tmux.js";
import { readConfig as readDashboardConfig, writeConfig as writeDashboardConfig } from "../core/dashboard-server.js";
import { writeClaudeMd } from "../core/claude-md.js";
import { readScheduleConfig, writeScheduleConfig, addJob, installSystemJob, parseHumanSchedule } from "../core/scheduler.js";
import { applyOpenPawTheme, verifyOpenPawTheme } from "../core/claude-theme.js";
import type { CliTool, DashboardTheme, InterfaceMode, Skill, TelegramConfig } from "../types.js";

// Category icons for the wizard
const CATEGORY_ICONS: Record<string, string> = {
	productivity: "📝",
	communication: "💬",
	media: "🎵",
	"smart-home": "🏠",
	research: "🔍",
	developer: "⚡",
	automation: "🤖",
	system: "⚙️",
};

export interface SetupOptions {
	preset?: string;
	yes?: boolean;
	dryRun?: boolean;
}

export async function setupCommand(opts: SetupOptions = {}): Promise<void> {
	await showBanner();

	const platform = detectPlatform();
	p.intro(accent(" openpaw setup "));

	// ── Platform ──
	const brewStatus = platform.hasBrew ? chalk.green("✓ brew") : chalk.red("✗ brew");
	const npmStatus = platform.hasNpm ? chalk.green("✓ npm") : chalk.red("✗ npm");
	const pipStatus = platform.hasPip ? chalk.green("✓ pip") : chalk.dim("○ pip");
	p.log.info(`${chalk.bold(platform.osName)} ${platform.osVersion}  ${brewStatus}  ${npmStatus}  ${pipStatus}`);

	// ── Prerequisites ──
	const missingPrereqs: string[] = [];
	if (!platform.hasBrew && platform.os === "darwin") {
		missingPrereqs.push(`${chalk.bold("Homebrew")} — most tools need it\n    ${dim('Install:')} /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"\n    ${dim('or visit')} https://brew.sh`);
	}
	if (!platform.hasNpm) {
		missingPrereqs.push(`${chalk.bold("Node.js + npm")} — needed for some tools\n    ${dim('Install:')} brew install node\n    ${dim('or visit')} https://nodejs.org`);
	}

	if (missingPrereqs.length > 0) {
		p.note(missingPrereqs.join("\n\n"), "Missing prerequisites");

		if (!opts.yes) {
			const cont = await p.confirm({
				message: "Continue anyway? (some tool installs may fail)",
				initialValue: true,
			});

			if (p.isCancel(cont) || !cont) {
				p.outro(dim("Install the prerequisites above and run openpaw again!"));
				process.exit(0);
			}
		}
	}

	// ── Personality (SOUL.md) ──
	let botName = "Paw";
	if (!opts.yes) {
		if (soulExists()) {
			// Existing personality found — ask before overwriting
			const updateSoul = await p.confirm({
				message: "Existing personality found (~/.claude/SOUL.md). Update it?",
				initialValue: false,
			});

			if (!p.isCancel(updateSoul) && updateSoul) {
				await pawPulse("think", "Let's get to know you again...");
				const soul = await soulQuestionnaire();
				if (soul) {
					botName = soul.botName;
					writeSoul(soul);
					setupMemory(soul.name);
					showSoulSummary(soul);
					p.log.success("Personality updated");
				}
			} else {
				setupMemory();
			}
		} else {
			await pawPulse("think", "Let's get to know you...");

			const wantSoul = await p.confirm({
				message: "Teach me your name and preferences? (makes me a better pup)",
				initialValue: true,
			});

			if (!p.isCancel(wantSoul) && wantSoul) {
				const soul = await soulQuestionnaire();
				if (soul) {
					botName = soul.botName;
					writeSoul(soul);
					setupMemory(soul.name);
					showSoulSummary(soul);
					p.log.success("Personality saved to ~/.claude/SOUL.md");
				}
			} else {
				setupMemory();
			}
		}
	} else {
		setupMemory();
	}

	// ── Skills ──
	let selectedSkills: Skill[];

	if (opts.preset) {
		selectedSkills = getPresetSkills(opts.preset, platform.os);
		if (selectedSkills.length === 0) {
			p.log.error(`Unknown preset: ${opts.preset}`);
			p.log.info(`Available: ${presets.map((pr) => pr.id).join(", ")}`);
			process.exit(1);
		}
		p.log.info(`Using preset: ${bold(opts.preset)} (${selectedSkills.length} skills)`);
	} else {
		selectedSkills = await selectSkills(platform.os);
	}

	if (selectedSkills.length === 0) {
		p.log.warn("No skills selected. Run openpaw again when you're ready!");
		p.outro("I'll be here napping... come back soon! 🐾");
		return;
	}

	// Resolve dependencies
	const resolved = resolveDependencies(selectedSkills);
	if (resolved.length > 0) {
		const depNames = resolved.map((s) => s.name).join(", ");
		p.log.info(`${dim("Auto-fetching dependencies:")} ${depNames}`);
		selectedSkills.push(...resolved);
	}

	await pawPulse("happy", `${selectedSkills.length} skill${selectedSkills.length > 1 ? "s" : ""} selected — good taste!`);

	// ── Sub-Choices ──
	if (!opts.yes) {
		for (const skill of selectedSkills) {
			if (skill.subChoices) {
				const choice = await p.select({
					message: `${skill.name}: ${skill.subChoices.question}`,
					options: skill.subChoices.options.map((o) => ({
						value: o.value,
						label: o.label,
					})),
				});

				if (p.isCancel(choice)) {
					p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
					process.exit(0);
				}

				const chosen = skill.subChoices.options.find((o) => o.value === choice);
				if (chosen) {
					skill.tools = chosen.tools;
				}
			}
		}
	} else {
		for (const skill of selectedSkills) {
			if (skill.subChoices && skill.tools.length === 0) {
				skill.tools = skill.subChoices.options[0].tools;
			}
		}
	}

	// ── Interface Mode ──
	let interfaceMode: InterfaceMode = "native";
	let telegramConfig: TelegramConfig | null = null;

	if (!opts.yes) {
		const modeChoice = await p.select({
			message: "How do you want to talk to Claude? 🐾",
			options: [
				{ value: "native", label: "🖥  Terminal only", hint: "Claude Code in your terminal" },
				{ value: "both", label: "🖥📱 Terminal + Telegram", hint: "terminal + talk from your phone" },
			],
		});

		if (p.isCancel(modeChoice)) {
			p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
			process.exit(0);
		}

		interfaceMode = modeChoice as InterfaceMode;

		// Telegram setup
		if (interfaceMode === "telegram" || interfaceMode === "both") {
			if (telegramConfigExists()) {
				p.log.info(dim("Telegram already configured — keeping existing config"));
			} else {
				telegramConfig = await telegramQuestionnaire();
				if (!telegramConfig) {
					p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
					process.exit(0);
				}
			}

			// Auto-add telegram skill if not already selected
			if (!selectedSkills.find((s) => s.id === "telegram")) {
				const tgSkill = skills.find((s) => s.id === "telegram");
				if (tgSkill) selectedSkills.push(tgSkill);
			}
		}
	}

	// ── Dashboard ──
	let wantDashboard = false;
	let dashboardTheme: DashboardTheme = "paw";

	if (!opts.yes) {
		const dashChoice = await p.confirm({
			message: `Want a task dashboard for ${botName}?`,
			initialValue: false,
		});

		if (!p.isCancel(dashChoice) && dashChoice) {
			wantDashboard = true;

			const themeChoice = await p.select({
				message: "Pick a dashboard theme",
				options: [
					{ value: "paw", label: "Paw", hint: "warm brown" },
					{ value: "midnight", label: "Midnight", hint: "cool dark blue" },
					{ value: "neon", label: "Neon", hint: "cyber green" },
				],
			});

			if (!p.isCancel(themeChoice)) {
				dashboardTheme = themeChoice as DashboardTheme;
			}
		}
	}

	// ── Smart Scheduling ──
	let wantScheduling = false;
	let schedulingCap = 5.0;
	let schedulingJobCount = 0;
	let wantClaudePawStyle = false;

	if (!opts.yes) {
		const schedChoice = await p.confirm({
			message: "Enable smart scheduling? (automate recurring tasks with cost control)",
			initialValue: false,
		});

		if (!p.isCancel(schedChoice) && schedChoice) {
			wantScheduling = true;

			const capInput = await p.text({
				message: "Daily cost cap in USD",
				placeholder: "5.00",
				initialValue: "5.00",
				validate: (v) => {
					const n = Number.parseFloat(v);
					return Number.isNaN(n) || n <= 0 ? "Enter a valid dollar amount" : undefined;
				},
			});

			if (!p.isCancel(capInput)) {
				schedulingCap = Number.parseFloat(capInput as string);
			}

			writeScheduleConfig({
				jobs: [],
				dailyCostCapUsd: schedulingCap,
				defaultModel: "sonnet",
			});

			const addJobNow = await p.confirm({
				message: "Want to add a recurring job now?",
				initialValue: false,
			});

			if (!p.isCancel(addJobNow) && addJobNow) {
				const jobPrompt = await p.text({
					message: "What should Claude do?",
					placeholder: "check email and summarize anything urgent",
				});

				if (!p.isCancel(jobPrompt)) {
					const jobSchedule = await p.text({
						message: "When? (e.g. \"weekdays 8am\", \"daily 6pm\", \"every 30 minutes\")",
						placeholder: "weekdays 8am",
					});

					if (!p.isCancel(jobSchedule)) {
						const jobModel = await p.select({
							message: "Model for this job",
							options: [
								{ value: "sonnet", label: "Sonnet", hint: "fast + capable (recommended)" },
								{ value: "haiku", label: "Haiku", hint: "cheapest" },
								{ value: "opus", label: "Opus", hint: "most capable" },
							],
						});

						const jobBudget = await p.text({
							message: "Per-run budget in USD",
							placeholder: "1.00",
							initialValue: "1.00",
						});

						const deliveryOpts: Array<{
							value: "telegram" | "file" | "notify";
							label: string;
							hint: string;
						}> = [
							{ value: "file" as const, label: "File", hint: "save to ~/.config/openpaw/schedule-results/" },
							{ value: "notify" as const, label: "Notification", hint: "macOS notification" },
						];
						if (interfaceMode === "telegram" || interfaceMode === "both") {
							deliveryOpts.unshift({ value: "telegram" as const, label: "Telegram", hint: "send to your bot" });
						}

						const jobDelivery = await p.select({
							message: "Where should results go?",
							options: deliveryOpts,
						});

						if (!p.isCancel(jobModel) && !p.isCancel(jobBudget) && !p.isCancel(jobDelivery)) {
							try {
								const parsed = parseHumanSchedule(jobSchedule as string);
								const job = addJob({
									name: (jobPrompt as string).slice(0, 40),
									prompt: jobPrompt as string,
									schedule: parsed.cron,
									scheduleHuman: parsed.human,
									enabled: true,
									model: jobModel as string,
									maxBudgetUsd: Number.parseFloat(jobBudget as string) || 1.0,
									delivery: { type: jobDelivery as "file" | "telegram" | "notify" },
								});
								installSystemJob(job);
								schedulingJobCount = 1;
								p.log.success(`Scheduled: "${parsed.human}" — ${jobModel}`);
							} catch (e) {
								p.log.warn(`Couldn't parse schedule — run ${bold("openpaw schedule add")} later`);
							}
						}
					}
				}
			}
		}
	}

	// ── Claude Code Paw Style ──
	if (!opts.yes) {
		const pawStyleChoice = await p.confirm({
			message: `Patch Claude Code globally so ${botName} gets the full Paw mascot and lock-in status line?`,
			initialValue: false,
		});

		if (!p.isCancel(pawStyleChoice) && pawStyleChoice) {
			wantClaudePawStyle = true;
		}
	}

	// ── Working Directory (default home) ──
	const projectDir = os.homedir();

	// ── Collect tools ──
	const allTools: CliTool[] = [];
	for (const skill of selectedSkills) {
		allTools.push(...skill.tools);
	}
	const uniqueTools = [...new Map(allTools.map((t) => [t.command, t])).values()];
	const taps = getAllTaps(selectedSkills);
	const missing = getMissingTools(uniqueTools);

	// ── Skills Location ──
	let targetDir: string;
	if (opts.yes) {
		targetDir = getDefaultSkillsDir();
	} else {
		const defaultDir = getDefaultSkillsDir();
		const skillsDir = await p.select({
			message: "Where should skills live?",
			options: [
				{ value: defaultDir, label: `Global ${dim("~/.claude/skills/")}`, hint: "recommended" },
				{ value: ".claude/skills", label: `Project ${dim(".claude/skills/")}` },
				{ value: "custom", label: "Custom path" },
			],
		});

		if (p.isCancel(skillsDir)) {
			p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
			process.exit(0);
		}

		targetDir = skillsDir as string;
		if (targetDir === "custom") {
			const customDir = await p.text({
				message: "Skills directory path:",
				placeholder: "~/.claude/skills",
				validate: (v) => (v.length === 0 ? "Path cannot be empty" : undefined),
			});
			if (p.isCancel(customDir)) {
				p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
				process.exit(0);
			}
			targetDir = (customDir as string).replace(/^~/, os.homedir());
		}
	}

	// ── Confirmation ──
	const summary = buildSummary(selectedSkills, uniqueTools, missing, taps, interfaceMode, projectDir);
	p.note(summary, "Here's what we're fetching");

	if (!opts.yes) {
		const proceed = await p.confirm({
			message: "Ready to fetch all these goodies?",
			initialValue: true,
		});

		if (p.isCancel(proceed) || !proceed) {
			p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
			process.exit(0);
		}
	}

	// ── Dry Run ──
	if (opts.dryRun) {
		p.log.info(dim("Dry run — no changes made. Just sniffing around."));
		p.outro(accent("openpaw dry run complete 🐾"));
		return;
	}

	// ── Installation ──
	await pawStep("work", "Fetching your goodies...");

	const s = p.spinner();

	if (taps.size > 0) {
		s.start("🐾 Sniffing out Homebrew taps...");
		const tapResults = installTaps(taps);
		const failed = [...tapResults].filter(([, ok]) => !ok);
		if (failed.length > 0) {
			s.stop(`Taps: ${taps.size - failed.length} added, ${failed.length} failed`);
		} else {
			s.stop(`🐾 ${taps.size} tap${taps.size > 1 ? "s" : ""} ready`);
		}
	}

	const failedTools: string[] = [];
	const installedTools: string[] = [];
	if (missing.length > 0) {
		for (let i = 0; i < missing.length; i++) {
			const tool = missing[i];
			s.start(`🐾 [${i + 1}/${missing.length}] Teaching Claude a new trick: ${bold(tool.name)}...`);
			const result = installTool(tool);
			if (result.success) {
				s.stop(`${chalk.green("✓")} ${tool.name}`);
				installedTools.push(tool.name);
			} else {
				s.stop(`${chalk.red("✗")} ${tool.name}`);
				failedTools.push(tool.name);
			}
		}
	} else if (uniqueTools.length > 0) {
		p.log.success("All tools already installed — clever pup!");
	}

	// Check for existing skills before installing
	const existingSkills = listInstalledSkills(targetDir);
	const overlapping = selectedSkills.filter((sk) => existingSkills.includes(sk.id));
	let updateExisting = true;

	if (overlapping.length > 0 && !opts.yes) {
		const updateChoice = await p.confirm({
			message: `${overlapping.length} skill${overlapping.length > 1 ? "s" : ""} already installed. Update their templates?`,
			initialValue: true,
		});
		if (!p.isCancel(updateChoice)) {
			updateExisting = updateChoice as boolean;
		}
	}

	installSkill("core", targetDir);
	installSkill("memory", targetDir);
	const installed: string[] = ["c-core", "c-memory"];
	for (const skill of selectedSkills) {
		s.start(`🐾 Installing ${bold("c-" + skill.id)}...`);
		if (!updateExisting && existingSkills.includes(skill.id)) {
			installed.push(`c-${skill.id}`);
			s.stop(`${chalk.green("✓")} c-${skill.id} ${dim("(kept existing)")}`);
			continue;
		}
		if (installSkill(skill.id, targetDir)) {
			installed.push(`c-${skill.id}`);
			s.stop(`${chalk.green("✓")} c-${skill.id}`);
		} else {
			s.stop(`${chalk.red("✗")} c-${skill.id}`);
		}
	}

	s.start("🐾 Setting up the doggy door...");
	const added = addPermissions(uniqueTools);
	s.stop(added.length > 0 ? `🐾 ${added.length} permission${added.length > 1 ? "s" : ""} added` : "🐾 Doggy door already open");

	s.start("🐾 Putting up the baby gate...");
	const hooksOk = installSafetyHooks();
	s.stop(hooksOk ? "🐾 Safety gate installed" : "🐾 Safety gate failed (non-critical)");

	// ── Telegram Config ──
	if (telegramConfig) {
		telegramConfig.workspaceDir = projectDir;
		telegramConfig.skills = selectedSkills.map((sk) => sk.id);
		writeTelegramConfig(telegramConfig);
		p.log.success("Telegram bridge configured");
	}

	// ── Dashboard Config ──
	if (wantDashboard) {
		const dashConfig = readDashboardConfig();
		dashConfig.theme = dashboardTheme;
		dashConfig.botName = botName;
		writeDashboardConfig(dashConfig);
		p.log.success(`Dashboard configured (theme: ${dashboardTheme})`);
	}

	// ── CLAUDE.md ──
	s.start("🐾 Writing CLAUDE.md...");
	writeClaudeMd(botName, selectedSkills, wantDashboard);
	s.stop(`${chalk.green("✓")} CLAUDE.md — ${botName} knows who they are now`);

	let pawThemeVerified = false;
	if (wantClaudePawStyle) {
		s.start("🐾 Teaching Claude some Paw manners...");
		try {
			applyOpenPawTheme();
			pawThemeVerified = verifyOpenPawTheme().verified;
			s.stop(
				pawThemeVerified
					? `${chalk.green("✓")} Claude Code is now Paw-styled`
					: `${chalk.yellow("!")} Claude Code patched, but verification is partial`,
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			s.stop(`${chalk.red("✗")} Claude Code paw style failed`);
			p.log.warn(message);
		}
	}

	// MCP servers can be configured separately via `openpaw mcp`

	// ── Auth Steps ──
	const authSteps = selectedSkills
		.flatMap((skill) => skill.authSteps ?? [])
		.filter((step, i, arr) => arr.findIndex((s) => s.command === step.command) === i);

	if (authSteps.length > 0 && !opts.yes) {
		const authList = authSteps
			.map((st) => `${chalk.yellow("→")} ${chalk.bold(st.command)}  ${dim(st.description)}`)
			.join("\n");
		p.note(authList, "One-time auth needed");

		const runAuth = await p.confirm({
			message: "Want to sign in to these now?",
			initialValue: true,
		});

		if (!p.isCancel(runAuth) && runAuth) {
			for (const step of authSteps) {
				const runThis = await p.confirm({
					message: `Run ${bold(step.command)}? ${dim(step.description)}`,
					initialValue: true,
				});

				if (p.isCancel(runThis)) break;
				if (!runThis) {
					p.log.info(dim(`Skipped ${step.command} — run it later when you need it`));
					continue;
				}

				p.log.info(`Running ${accent(step.command)}...`);
				try {
					execSync(step.command, { stdio: "inherit" });
					p.log.success(`${step.command} — signed in`);
				} catch {
					p.log.warn(`${step.command} — failed or cancelled (you can run it later)`);
				}
			}
		} else {
			p.log.info(dim("No problem — run these commands when you need each skill"));
		}
	} else if (authSteps.length > 0) {
		const authList = authSteps
			.map((st) => `${chalk.yellow("→")} ${chalk.bold(st.command)}  ${dim(st.description)}`)
			.join("\n");
		p.note(authList, "One-time auth needed (run these later)");
	}

	// ── Summary ──
	const summaryLines: string[] = [
		`${bold("Skills:")}      ${installed.length} installed`,
		`${bold("Tools:")}       ${uniqueTools.length - missing.length} ready` + (installedTools.length > 0 ? `, ${installedTools.length} newly installed` : ""),
	];
	if (failedTools.length > 0) {
		summaryLines.push(`${bold("Failed:")}      ${chalk.red(failedTools.join(", "))}`);
	}
	if (wantDashboard) {
		summaryLines.push(`${bold("Dashboard:")}   ${dashboardTheme} theme on :3141`);
	}
	if (wantScheduling) {
		summaryLines.push(`${bold("Scheduling:")}  $${schedulingCap}/day cap` + (schedulingJobCount > 0 ? `, ${schedulingJobCount} job` : ""));
	}
	if (wantClaudePawStyle) {
		summaryLines.push(`${bold("Claude UI:")}   Paw style ${pawThemeVerified ? "installed" : "partially installed"}`);
	}
	summaryLines.push(`${bold("CLAUDE.md:")}   ${botName} is self-aware`);
	summaryLines.push(`${bold("Memory:")}      ~/.claude/memory/`);
	p.note(summaryLines.join("\n"), "Setup Complete");

	// ── Done + Launch ──
	await pawStep("done", "All done! *tail wag intensifies*");

	console.log("");
	console.log(dim(`  ${botName} is ready to play! Try saying:`));
	console.log(`  ${subtle('"What are my latest emails?"')}`);
	console.log(`  ${subtle('"Play some jazz on Spotify"')}`);
	console.log(`  ${subtle('"Go to hacker news and summarize the top posts"')}`);
	console.log("");

	// ── Launch Dashboard ──
	if (wantDashboard) {
		const { startDashboard } = await import("../core/dashboard-server.js");
		startDashboard({ theme: dashboardTheme, botName });
		p.log.success("Dashboard launched in your browser");
	}

	if (opts.yes) {
		p.outro(accent("openpaw setup complete 🐾"));
		return;
	}

	// Offer to launch
	const launch = await p.confirm({
		message: "Time to go for a walk? (Launch your assistant)",
		initialValue: true,
	});

	if (p.isCancel(launch) || !launch) {
		if (interfaceMode === "telegram" || interfaceMode === "both") {
			p.log.info(`Start the Telegram bridge anytime with: ${bold("openpaw telegram")}`);
		}
		p.outro(accent("openpaw setup complete 🐾 — come back anytime!"));
		return;
	}

	// ── Dangerous Mode Disclaimer ──
	let useDangerousMode = false;
	{
		showPuppyDisclaimer();

		const acceptDanger = await p.confirm({
			message: "Unleash full paw-er? *excited tail wag*",
			initialValue: true,
		});

		if (!p.isCancel(acceptDanger)) {
			useDangerousMode = acceptDanger as boolean;
		}
	}

	// ── tmux Option ──
	let useTmux = false;
	if (isTmuxAvailable() && !isInTmux()) {
		const tmuxDefault = interfaceMode === "both";
		const tmuxChoice = await p.confirm({
			message: "Run in tmux? (keeps going when you close the terminal)",
			initialValue: tmuxDefault,
		});

		if (!p.isCancel(tmuxChoice)) {
			useTmux = tmuxChoice as boolean;
		}
	}

	// ── Build launch commands ──
	const dangerFlag = useDangerousMode ? " --dangerously-skip-permissions" : "";
	const nativeCmd = `claude${dangerFlag}`;
	const telegramCmd = "npx openpaw telegram";

	// ── Launch ──
	if (useTmux) {
		p.outro(accent("Launching in tmux... 🐾"));
		launchInTmux({
			nativeCmd,
			telegramCmd: interfaceMode === "both" ? telegramCmd : undefined,
			workDir: projectDir,
		});
	} else if (interfaceMode === "native") {
		p.outro(accent("Starting Claude Code... 🐾"));
		try {
			execSync(nativeCmd, { stdio: "inherit", cwd: projectDir });
		} catch {
			p.log.warn("Could not launch Claude Code. Make sure it's installed: https://claude.ai/code");
		}
	} else {
		// Both without tmux: telegram in background, native in foreground
		p.log.info(dim("Starting Telegram bridge in background..."));
		launchInBackground(telegramCmd);
		p.outro(accent("Starting Claude Code... 🐾"));
		try {
			execSync(nativeCmd, { stdio: "inherit", cwd: projectDir });
		} catch {
			p.log.warn("Could not launch Claude Code. Make sure it's installed: https://claude.ai/code");
		}
	}
}

// ── Skill Selection ──

async function selectSkills(os: string): Promise<Skill[]> {
	const mode = await p.select({
		message: "How should we set things up, human?",
		options: [
			{ value: "preset", label: "⚡ Quick Setup", hint: "pick a treat... I mean, a preset" },
			{ value: "custom", label: "🎯 Custom", hint: "sniff through skills one by one" },
		],
	});

	if (p.isCancel(mode)) {
		p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
		process.exit(0);
	}

	if (mode === "preset") {
		return await selectFromPreset(os);
	}
	return await selectCustom(os);
}

async function selectFromPreset(os: string): Promise<Skill[]> {
	const presetChoice = await p.select({
		message: "Pick a treat... I mean, a preset!",
		options: presets.map((pr) => ({
			value: pr.id,
			label: pr.name,
			hint: pr.description,
		})),
	});

	if (p.isCancel(presetChoice)) {
		p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
		process.exit(0);
	}

	const presetSkills = getPresetSkills(presetChoice as string, os);
	const skillNames = presetSkills.map((s) => s.name).join(", ");
	p.log.info(`${dim("Includes:")} ${skillNames}`);

	return presetSkills;
}

async function selectCustom(os: string): Promise<Skill[]> {
	const grouped = getSkillsByCategory(os);

	// Flat list with category labels in hints
	const options: { value: string; label: string; hint?: string }[] = [];
	for (const [category, catSkills] of grouped) {
		const icon = CATEGORY_ICONS[category] ?? "📦";
		const catLabel = categoryLabels[category] ?? category;
		let isFirst = true;

		for (const skill of catSkills) {
			// Telegram is handled by interface mode — skip here
			if (skill.id === "telegram") continue;

			options.push({
				value: skill.id,
				label: `${icon} ${skill.name}`,
				hint: isFirst ? `── ${catLabel} ── ${skill.description}` : skill.description,
			});
			isFirst = false;
		}
	}

	const selected = await p.multiselect({
		message: "Pick your skills (space to select, enter to confirm)",
		options,
		required: false,
	});

	if (p.isCancel(selected)) {
		p.cancel("Ok, I'll be here when you're ready *sad puppy eyes*");
		process.exit(0);
	}

	const ids = selected as string[];
	return ids
		.map((id) => skills.find((s) => s.id === id))
		.filter((s): s is Skill => !!s);
}


// ── Summary ──

function buildSummary(
	selectedSkills: Skill[],
	uniqueTools: CliTool[],
	missing: CliTool[],
	taps: Set<string>,
	interfaceMode: InterfaceMode,
	projectDir: string,
): string {
	const lines: string[] = [];
	lines.push(`${bold("Skills:")}     ${selectedSkills.map((s) => s.name).join(", ")}`);
	lines.push(`${bold("Tools:")}      ${uniqueTools.length} total, ${missing.length} to install`);
	if (taps.size > 0) {
		lines.push(`${bold("Taps:")}       ${[...taps].join(", ")}`);
	}
	const modeLabel = interfaceMode === "native" ? "Terminal" : "Terminal + Telegram";
	lines.push(`${bold("Interface:")}  ${modeLabel}`);
	lines.push(`${bold("Workspace:")}  ${projectDir.replace(os.homedir(), "~")}`);
	lines.push(`${bold("Memory:")}     ~/.claude/memory/`);
	lines.push(`${bold("Soul:")}       ~/.claude/SOUL.md`);
	lines.push(`${bold("Claude UI:")}  optional Paw global patch`);
	return lines.join("\n");
}

// ── Dependency Resolution ──

function resolveDependencies(selectedSkills: Skill[]): Skill[] {
	const selectedIds = new Set(selectedSkills.map((s) => s.id));
	const added: Skill[] = [];

	for (const skill of selectedSkills) {
		if (!skill.depends) continue;
		for (const depId of skill.depends) {
			if (!selectedIds.has(depId)) {
				const dep = getSkillById(depId);
				if (dep) {
					added.push(dep);
					selectedIds.add(depId);
				}
			}
		}
	}

	return added;
}
