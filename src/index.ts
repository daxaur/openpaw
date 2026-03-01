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
	.version("1.1.0");

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
