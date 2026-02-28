---
name: c-telegram
description: Bidirectional Telegram bridge — talk to Claude from your phone. Built into OpenPaw.
tags: [telegram, messaging, communication, bot, bridge]
---

# Telegram Bridge

Full bidirectional Claude-from-Telegram. Send messages from your phone, get responses from Claude with all your skills available.

## How It Works

The OpenPaw Telegram bridge (`openpaw telegram`) connects a Telegram bot to Claude via the Agent SDK. Every skill installed in `~/.claude/skills/` is available as a bot command.

## Starting the Bridge

```bash
openpaw telegram
```

This starts a long-running process. Keep it open in a terminal or tmux session.

## Bot Commands

Built-in:
- `/start` — show status and available skills
- `/model sonnet|opus|haiku` — switch Claude model
- `/skills` — list installed skills
- `/stop` — cancel current operation
- `/clear` — reset conversation

Skill commands (auto-generated from your installed skills):
- `/email check my inbox`
- `/music play some jazz`
- `/notes add grocery list`
- `/calendar what's on tomorrow`
- (any installed skill becomes a /command)

Or just send a regular message — Claude will figure out which skill to use.

## Setup

Run during `openpaw setup` or separately:

```bash
openpaw telegram setup
```

You'll need:
1. A Telegram bot token (from @BotFather)
2. Your Telegram user ID (from @userinfobot)

Config is saved to `~/.config/openpaw/telegram.json`.

## Security

- Only responds to whitelisted user IDs
- Bot token stored with 600 permissions (owner-only)
- All Claude operations run locally on your machine

## Guidelines

- The bridge maintains conversation context per user
- Use `/clear` to start fresh if Claude gets confused
- Use `/stop` to cancel long-running operations
- Model can be switched anytime with `/model`
