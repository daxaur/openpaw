import { Command } from "commander";
import { setupCommand } from "./commands/setup.js";
import { addCommand } from "./commands/add.js";
import { removeCommand } from "./commands/remove.js";
import { statusCommand } from "./commands/status.js";
import { doctorCommand } from "./commands/doctor.js";
import { updateCommand } from "./commands/update.js";
import { resetCommand } from "./commands/reset.js";
import { listCommand } from "./commands/list.js";
import { soulCommand } from "./commands/soul.js";
import { exportCommand, importCommand } from "./commands/export.js";
import { telegramCommand, telegramSetupCommand } from "./commands/telegram.js";
import { dashboardCommand } from "./commands/dashboard.js";
import { configureCommand } from "./commands/configure.js";
import { lockInCommand, lockInSetupCommand, lockInConfigureCommand, lockInGenScriptsCommand } from "./commands/lockin.js";
import {
	themeApplyCommand,
	themeCommand,
	themeInstallCommand,
	themeRestoreCommand,
	themeStatusCommand,
	themeVerifyCommand,
} from "./commands/theme.js";
import {
	scheduleAddCommand,
	scheduleListCommand,
	scheduleRemoveCommand,
	scheduleRunCommand,
	scheduleToggleCommand,
	scheduleCostsCommand,
	scheduleSetCapCommand,
} from "./commands/schedule.js";

const program = new Command();

program
	.name("openpaw")
	.description("Personal Assistant Wizard for Claude Code")
	.version("1.5.1");

program
	.command("setup", { isDefault: true })
	.description("Interactive setup wizard — pick skills, install tools, configure Claude Code")
	.option("-p, --preset <name>", "Use a preset (everything, essentials, productivity, developer, creative, smart-home)")
	.option("-y, --yes", "Skip confirmations, use defaults")
	.option("--dry-run", "Show what would be installed without making changes")
	.action(setupCommand);

program
	.command("add")
	.description("Add skill(s) by name")
	.argument("<skills...>", "Skill IDs to add (e.g. notes music email)")
	.action(addCommand);

program
	.command("remove")
	.description("Remove skill(s) by name")
	.argument("<skills...>", "Skill IDs to remove")
	.action(removeCommand);

program
	.command("list")
	.alias("ls")
	.description("Show all available skills")
	.action(listCommand);

program
	.command("status")
	.description("Show installed skills and tool versions")
	.action(statusCommand);

program
	.command("doctor")
	.description("Diagnose issues with installed skills and tools")
	.action(doctorCommand);

program
	.command("update")
	.description("Update all installed CLI tools via Homebrew")
	.action(updateCommand);

program
	.command("reset")
	.description("Remove all OpenPaw skills, permissions, and hooks")
	.action(resetCommand);

program
	.command("soul")
	.description("Set up or edit Claude's personality (SOUL.md)")
	.action(soulCommand);

program
	.command("export")
	.description("Export skills, memory, and config to a file")
	.action(exportCommand);

program
	.command("import")
	.description("Import skills, memory, and config from a file")
	.argument("<file>", "Path to openpaw-export.json")
	.action(importCommand);

program
	.command("dashboard")
	.description("Start the task manager dashboard in your browser")
	.option("-p, --port <port>", "Port to run on (default: 3141)")
	.option("-t, --theme <theme>", "Theme: paw, midnight, neon, or rose")
	.option("--no-open", "Start server without opening browser")
	.action(dashboardCommand);

program
	.command("configure")
	.alias("config")
	.description("Configure your setup — add skills, change personality, manage dashboard")
	.action(configureCommand);

const theme = program
	.command("theme")
	.description("Patch Claude Code with OpenPaw styling using tweakcc");

theme
	.argument("[preset]", "Theme preset to apply", "paw")
	.action((preset) => themeCommand(preset));

theme
	.command("install [preset]")
	.description("Install the OpenPaw Claude Code patch globally")
	.action((preset) => themeInstallCommand(preset));

theme
	.command("apply [preset]")
	.description("Apply an OpenPaw theme preset to Claude Code")
	.action((preset) => themeApplyCommand(preset));

theme
	.command("status")
	.description("Show Claude Code theme status")
	.action(() => themeStatusCommand());

theme
	.command("verify")
	.description("Verify that the installed Claude Code binary contains OpenPaw markers")
	.action(() => themeVerifyCommand());

theme
	.command("restore")
	.description("Restore Claude Code to the pre-OpenPaw theme state")
	.action(() => themeRestoreCommand());

// ── Lock In ──

const lockin = program
	.command("lockin")
	.description("Start a lock-in session — block distractions, set the mood, get in the zone");

lockin.action(lockInCommand);

lockin.command("setup")
	.description("Set up or reconfigure Lock In Mode")
	.action(lockInSetupCommand);

lockin.command("configure")
	.alias("config")
	.description("Reconfigure Lock In Mode (alias for setup)")
	.action(lockInConfigureCommand);

lockin.command("gen-scripts")
	.description("Generate start/end shell scripts from config (used by Claude)")
	.requiredOption("--ends <iso>", "Session end time (ISO 8601)")
	.option("--extra-sites <sites>", "Comma-separated extra sites to block")
	.option("--extra-apps <apps>", "Comma-separated extra apps to quit")
	.action(lockInGenScriptsCommand);

const tg = program
	.command("telegram")
	.description("Start the Telegram bridge — talk to Claude from your phone");

tg.action(telegramCommand);

tg.command("setup")
	.description("Set up or reconfigure the Telegram bot")
	.action(telegramSetupCommand);

// ── Schedule ──

const sched = program
	.command("schedule")
	.description("Manage scheduled jobs — automate recurring tasks with cost control");

sched
	.command("add [schedule]")
	.description("Add a scheduled job")
	.option("--run <prompt>", "What Claude should do")
	.option("--model <model>", "Model to use (sonnet/opus/haiku)", "sonnet")
	.option("--budget <usd>", "Per-run budget cap in USD", "1.00")
	.option("--delivery <type>", "Delivery method (telegram/file/notify)", "file")
	.action((schedule, opts) => scheduleAddCommand(schedule, opts));

sched
	.command("list")
	.alias("ls")
	.description("List all scheduled jobs")
	.action(() => scheduleListCommand());

sched
	.command("remove <id>")
	.alias("rm")
	.description("Remove a scheduled job")
	.action((id) => scheduleRemoveCommand(id));

sched
	.command("run <id>")
	.description("Manually trigger a scheduled job")
	.action((id) => scheduleRunCommand(id));

sched
	.command("enable <id>")
	.description("Enable a scheduled job")
	.action((id) => scheduleToggleCommand(id, true));

sched
	.command("disable <id>")
	.description("Disable a scheduled job")
	.action((id) => scheduleToggleCommand(id, false));

sched
	.command("costs")
	.description("Show today's cost usage and daily cap")
	.action(() => scheduleCostsCommand());

sched
	.command("set-cap <usd>")
	.description("Set the daily cost cap in USD")
	.action((usd) => scheduleSetCapCommand(usd));

program.parse();
