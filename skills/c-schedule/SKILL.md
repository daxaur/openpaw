---
name: c-schedule
description: Smart scheduling — automate recurring Claude tasks with cost control. Deliver results to Telegram, file, or notification. Built into OpenPaw.
tags: [schedule, automation, cron, recurring, proactive, cost-control]
---

# Smart Scheduling

Automate recurring tasks with Claude. Jobs run on a schedule via launchd (macOS) or cron (Linux), with built-in cost caps to prevent runaway spending.

## Managing Schedules

```bash
# Add a scheduled job (inline)
openpaw schedule add "weekdays 8am" --run "check email and summarize the important ones"
openpaw schedule add "daily 9pm" --run "review today's GitHub notifications"
openpaw schedule add "every 30 minutes" --run "check if any urgent emails arrived" --model haiku

# Interactive mode (prompts for all options)
openpaw schedule add

# List all jobs
openpaw schedule list

# Remove a job
openpaw schedule remove <id>

# Manually trigger a job
openpaw schedule run <id>

# Enable/disable without removing
openpaw schedule enable <id>
openpaw schedule disable <id>

# View cost usage
openpaw schedule costs

# Set daily cost cap
openpaw schedule set-cap 10.00
```

## Schedule Syntax

Human-readable formats:
- `weekdays 8am` or `weekdays 08:00`
- `daily 9pm` or `daily 21:00`
- `weekends 10am`
- `every 30 minutes`
- `every 2 hours`
- `monday 9am`, `friday 5pm`, etc.
- Raw cron: `0 8 * * 1-5`

## Cost Control

- **Daily cap**: $5/day by default — jobs are skipped if the cap would be exceeded
- **Per-run budget**: Each job has its own budget cap (default $1.00)
- **Cost tracking**: All costs logged to `~/.config/openpaw/schedule-costs.json`
- **30-day history**: Old entries auto-pruned
- **View anytime**: `openpaw schedule costs`

## Delivery Methods

- **telegram** — results sent directly to your Telegram (requires Telegram bridge setup)
- **file** — saved to `~/.config/openpaw/schedule-results/` (always saved as backup)
- **notify** — macOS notification via terminal-notifier

## How It Works

1. Jobs are stored in `~/.config/openpaw/schedules.json`
2. Each job registers as a system scheduler:
   - **macOS**: launchd plist in `~/Library/LaunchAgents/`
   - **Linux**: crontab entry
3. When triggered, `openpaw schedule run <id>` is called
4. Claude runs with the job's prompt via the Agent SDK
5. Results are delivered to the configured channel
6. Cost is recorded

## Guidelines

- Use **haiku** for simple, frequent checks (cheapest)
- Use **sonnet** for routine tasks like email summaries
- Use **opus** only for complex analysis (expensive)
- Test jobs manually first: `openpaw schedule run <id>`
- Start with a higher per-run budget and reduce once you know typical costs
- Check `openpaw schedule costs` to monitor spending

## Common Recipes

```bash
# Morning briefing to Telegram
openpaw schedule add "weekdays 8am" --run "give me a morning briefing: check email, calendar, and any GitHub notifications" --delivery telegram

# Evening project summary
openpaw schedule add "daily 6pm" --run "summarize what I worked on today based on git commits and recent files" --delivery file

# Urgent email monitor
openpaw schedule add "every 30 minutes" --run "check for urgent emails and notify me if any" --model haiku --budget 0.25 --delivery notify
```
