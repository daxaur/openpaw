<p align="center">
<pre align="center">
        ▄██▄ ▄██▄
        ▀██▀ ▀██▀
      ▄██▄     ▄██▄
      ▀██▀     ▀██▀
         ▄██████▄
       ▄██████████▄
       ██████████████
       ▀██████████▀
         ▀██████▀
</pre>
</p>

<h1 align="center">OpenPaw</h1>
<p align="center"><b>Personal Assistant Wizard for Claude Code</b></p>
<p align="center"><i>*wags tail furiously* — your new best friend is here.</i></p>

<p align="center">
  <a href="https://www.npmjs.com/package/openpaw"><img src="https://img.shields.io/npm/v/openpaw?color=b4783c&label=npm&style=flat-square" alt="npm"></a>
  <a href="https://github.com/daxaur/openpaw/blob/main/LICENSE"><img src="https://img.shields.io/github/license/daxaur/openpaw?color=c88a48&style=flat-square" alt="license"></a>
  <a href="https://github.com/daxaur/openpaw"><img src="https://img.shields.io/github/stars/daxaur/openpaw?color=dca03c&style=flat-square" alt="stars"></a>
</p>

---

## Quick Start

```bash
npx pawmode
```

Pick your skills. Choose terminal, Telegram, or both. Claude does the rest. Good boy.

```bash
# Skip the wizard with a preset
npx pawmode --preset essentials
npx pawmode --preset developer --yes
```

---

## What is OpenPaw?

OpenPaw turns **Claude Code** into a full personal assistant. One command, 30+ skills, and a really good boy who fetches your emails, plays your music, and controls your smart home.

```
npx pawmode
  ┌───────────────────────────────────────┐
  │  How should we set things up, human?  │
  │                                       │
  │  > ⚡ Quick Setup (pick a preset)     │
  │    🎯 Custom (sniff through skills)   │
  └───────────────────────────────────────┘

  How do you want to talk to Claude? 🐾
  > 🖥  Terminal only
  > 📱 Telegram
  > 🖥📱 Both

  ✔ Sniffed out Homebrew taps
  ✔ Taught Claude new tricks
  ✔ Buried treats in ~/.claude/skills/
  ✔ Set up the doggy door (permissions)
  ✔ Put up the baby gate (safety hooks)
  ✔ All done! *tail wag intensifies*
```

Then just talk to Claude — from your terminal or your phone:

```
> "What emails did I get today?"
> "Play lo-fi on Spotify"
> "Turn the bedroom lights to 20%"
> "What's on my calendar tomorrow?"
> "Go to hacker news and summarize the top 5 posts"
```

**No daemon.** OpenPaw runs once, writes config, gets out of the way. No subscriptions. No extra cost. Just a wizard that sets things up and takes a nap. 🐾

---

## Telegram Bridge

Talk to Claude from your phone. Full bidirectional. All your skills available as bot commands.

```bash
# Set up during the wizard, or separately:
openpaw telegram setup

# Start the bridge:
openpaw telegram
```

**Bot commands** (auto-generated from your skills):
- `/email check my inbox`
- `/music play some jazz`
- `/notes add grocery list`
- `/model sonnet` / `/model opus` / `/model haiku` — switch models on the fly
- `/skills` — see what's installed
- `/stop` — cancel current operation
- `/clear` — fresh start

Or just send a regular message. Claude figures out which skill to use.

---

## PAW MODE

When you launch Claude through OpenPaw, it runs in **PAW MODE** — full personal assistant mode. Claude knows your name, your preferences, what skills are installed, and greets you at session start.

PAW MODE is established through:
- `~/.claude/SOUL.md` — your personality config
- `~/.claude/skills/c-core/SKILL.md` — the coordinator brain
- `~/.claude/memory/` — persistent facts across sessions

---

## Presets

Get started fast with a preset, or choose `Custom` to sniff through skills one by one.

| Preset | Skills |
|---|---|
| **Everything** | All 31 skills for your platform |
| **Essentials** | Email, calendar, notes, music, browser, system, notifications |
| **Productivity** | Notes, Obsidian, tasks, email, calendar, Slack, cloud files |
| **Developer** | GitHub, Linear, Jira, browser, network, AI, cron |
| **Creative & Media** | Music, video, screen, voice, browser, research |
| **Smart Home** | Lights, speakers, Bluetooth, system, display, notifications |

---

## Skills

31 capabilities across 8 categories. Install only what you need.

### Productivity

| Skill | Description | Tools |
|---|---|---|
| `c-notes` | Apple Notes + Reminders | `memo` `remindctl` |
| `c-obsidian` | Obsidian vault management | `obsidian-cli` |
| `c-notion` | Notion pages + databases | `notion-cli` |
| `c-tasks` | Todoist / Things 3 / Taskwarrior | choose during setup |

### Communication

| Skill | Description | Tools |
|---|---|---|
| `c-email` | Read, send, search email (Gmail or IMAP) | `gog` `himalaya` |
| `c-calendar` | Events + scheduling (Google or Apple) | `gog` `icalpal` |
| `c-messaging` | iMessage + WhatsApp | `imsg` `wacli` |
| `c-slack` | Slack channels + DMs | `slack` |
| `c-social` | Twitter/X | `bird` |
| `c-telegram` | Telegram bridge (built-in) | — |

### Media

| Skill | Description | Tools |
|---|---|---|
| `c-music` | Spotify playback + search | `spogo` |
| `c-video` | YouTube download + convert | `yt-dlp` `ffmpeg` |
| `c-screen` | Screenshots, OCR, webcam | `peekaboo` `camsnap` |
| `c-voice` | Speech-to-text + TTS | `sag` `say` |

### Smart Home

| Skill | Description | Tools |
|---|---|---|
| `c-lights` | Philips Hue control | `openhue` |
| `c-speakers` | Sonos speakers | `sonos` |
| `c-bluetooth` | Bluetooth devices | `blu` |

### Browser & Automation

| Skill | Description | Tools |
|---|---|---|
| `c-browser` | Headless browser — navigate, click, scrape | `agent-browser` / `playwright` |
| `c-cron` | Cron jobs + launchctl services | `lunchy-go` |

### System & Files

| Skill | Description | Tools |
|---|---|---|
| `c-system` | macOS Swiss Army Knife — volume, wifi, battery, dock | `m` |
| `c-apps` | Mac App Store from CLI | `mas` |
| `c-files` | Cloud sync — Google Drive, S3, Dropbox, 70+ providers | `rclone` |
| `c-display` | Display brightness + safe trash | `brightness` `trash` |
| `c-notify` | Native macOS notifications | `terminal-notifier` |

### Research & Utilities

| Skill | Description | Tools |
|---|---|---|
| `c-research` | Summarize URLs, PDFs, videos | `summarize` |
| `c-location` | Apple Maps + nearby places | `goplaces` |
| `c-tracking` | Package tracking (UPS, FedEx, etc.) | `ordercli` |
| `c-secrets` | 1Password / Bitwarden | `op` `bw` |
| `c-network` | DNS lookups + HTTP client | `doggo` `http` |
| `c-ai` | Query LLMs — pipe text, chat, summarize | `llm` `aichat` |

### Developer

| Skill | Description | Tools |
|---|---|---|
| `c-github` | PRs, issues, repos, actions | `gh` `jq` |
| `c-linear` | Linear issues + projects | `linear` |
| `c-jira` | Jira issues + sprints | `jira` |

---

## Commands

| Command | Description |
|---|---|
| `openpaw` | Interactive setup wizard |
| `openpaw --preset <name>` | Quick setup with a preset |
| `openpaw --preset <name> --yes` | Non-interactive setup |
| `openpaw --dry-run` | Preview what would be installed |
| `openpaw telegram` | Start the Telegram bridge |
| `openpaw telegram setup` | Configure Telegram bot |
| `openpaw list` | Show all available skills |
| `openpaw add <skills>` | Add skills — `openpaw add notes music email` |
| `openpaw remove <skills>` | Remove skills |
| `openpaw status` | Show installed skills + tool versions |
| `openpaw doctor` | Diagnose issues |
| `openpaw update` | Upgrade CLI tools |
| `openpaw soul` | Edit personality (SOUL.md) |
| `openpaw export` | Export config + memory |
| `openpaw import <file>` | Import config from file |
| `openpaw reset` | Remove everything OpenPaw installed |

---

## How It Works

OpenPaw doesn't run in the background (except the optional Telegram bridge). Here's what happens:

```
1. You pick a preset or choose individual skills
2. Pick your interface: terminal, Telegram, or both
3. CLI tools are installed via brew/npm/pip
4. SKILL.md files are created in ~/.claude/skills/
5. Permissions + safety hooks are configured
6. Telegram bridge is set up (if selected)
7. Claude launches in PAW MODE — ready to fetch! 🐾
```

**Skills** are SKILL.md files that Claude auto-discovers. They teach Claude how to use each CLI tool.

**Permissions** let Claude run tools without prompting you every time. Only the minimum needed.

**Safety hooks** block dangerous patterns like mass-delete, mass-email, and credential exposure. Baby gate = installed.

**`--dangerously-skip-permissions`** lets Claude actually be your assistant. The wizard explains this and asks before enabling. Safety hooks still protect you.

---

## Why OpenPaw?

- **Free forever** — uses your existing Claude subscription
- **No daemon** — runs once, configures, takes a nap
- **No attack surface** — no open ports, no cloud dependencies
- **5-minute setup** — from zero to personal assistant
- **Telegram built-in** — talk to Claude from your phone
- **31 skills** — email, music, smart home, GitHub, browser, and more
- **Open source** — MIT license, community-driven

---

## The `/c` Coordinator

Every OpenPaw install includes `c-core` — a coordinator skill that acts as the brain. It knows what's installed and routes your requests to the right tool.

```
/c what emails came in today?
/c play something chill on spotify
/c add "buy groceries" to my reminders
/c search my obsidian vault for project ideas
```

---

## tmux Support

For the Telegram bridge (or running "both" mode), OpenPaw can set up a tmux session:

```bash
# The wizard offers this automatically, or:
tmux new-session -s openpaw 'openpaw telegram'
```

In "both" mode, tmux splits into two panes — Claude Code on the left, Telegram bridge on the right.

---

## Contributing

Want to teach this pup a new trick? It's easy:

```bash
# 1. Fork the repo
gh repo fork daxaur/openpaw

# 2. Create your skill template
mkdir skills/c-yourskill
# Write a SKILL.md with YAML frontmatter + usage instructions

# 3. Add tool definitions to the catalog
# Edit src/catalog/index.ts

# 4. Submit a PR
gh pr create
```

### Skill template format

```markdown
---
name: c-yourskill
description: Short description (under 400 chars)
tags: [tag1, tag2]
---

# Your Skill Name

Instructions for Claude on how to use the CLI tool...
```

---

## License

MIT — do whatever you want with it. Go fetch.

Made with care (and tail wags) by [@daxaur](https://github.com/daxaur) 🐾
