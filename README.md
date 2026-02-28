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
<p align="center"><i>Open-source. No daemon. No extra subscriptions.</i></p>

<p align="center">
  <a href="https://www.npmjs.com/package/openpaw"><img src="https://img.shields.io/npm/v/openpaw?color=6366f1&label=npm&style=flat-square" alt="npm"></a>
  <a href="https://github.com/daxaur/openpaw/blob/main/LICENSE"><img src="https://img.shields.io/github/license/daxaur/openpaw?color=a855f7&style=flat-square" alt="license"></a>
  <a href="https://github.com/daxaur/openpaw"><img src="https://img.shields.io/github/stars/daxaur/openpaw?color=3b82f6&style=flat-square" alt="stars"></a>
</p>

---

## Quick Start

```bash
npx openpaw
```

Pick a preset or choose individual skills. Install tools. Claude does the rest.

```bash
# Or skip the wizard with a preset
npx openpaw --preset essentials
npx openpaw --preset developer --yes
```

---

## What is OpenPaw?

OpenPaw turns **Claude Code** into a full personal assistant. One command sets everything up:

```
npx openpaw
  ┌─────────────────────────────────┐
  │  How would you like to set up?  │
  │                                 │
  │  > Quick Setup (pick a preset)  │
  │    Custom (individual skills)   │
  └─────────────────────────────────┘

  > Essentials — email, calendar, notes, music, browser, system
  > Developer  — GitHub, Linear, Jira, browser, network, AI
  > Creative   — music, video, screen, voice, browser
  > Everything — all 32 skills

  ✔ Homebrew taps added
  ✔ CLI tools installed
  ✔ Skills created in ~/.claude/skills/
  ✔ Permissions configured
  ✔ Safety hooks installed
  ✔ Done!
```

Now open Claude Code and just ask:

```
> "What emails did I get today?"
> "Add milk to my grocery list"
> "Play lo-fi on Spotify"
> "Search my Obsidian vault for meeting notes"
> "Turn the bedroom lights to 20%"
> "What's on my calendar tomorrow?"
> "Track my Amazon package"
> "Go to hacker news and summarize the top 5 posts"
> "Set my volume to 30%"
> "Update all my Mac App Store apps"
```

**No daemon.** OpenPaw runs once, writes config, exits. It's a wizard, not a runtime.

---

## Presets

Get started fast with a preset, or choose `Custom` to pick individual skills.

| Preset | Skills |
|---|---|
| **Everything** | All 32 skills for your platform |
| **Essentials** | Email, calendar, notes, music, browser, system, notifications |
| **Productivity** | Notes, Obsidian, tasks, email, calendar, Slack, cloud files, notifications |
| **Developer** | GitHub, Linear, Jira, browser, network, AI, cron |
| **Creative & Media** | Music, video, screen, voice, browser, research |
| **Smart Home** | Lights, speakers, Bluetooth, system, display, notifications |

---

## Skills

32 capabilities across 8 categories. Install only what you need.

### Productivity

| Skill | Description | CLI Tools |
|---|---|---|
| `c-notes` | Apple Notes + Reminders | `memo` `remindctl` |
| `c-obsidian` | Obsidian vault management | `obsidian-cli` |
| `c-notion` | Notion pages + databases | `notion-cli` |
| `c-tasks` | Todoist / Things 3 / Taskwarrior | choose during setup |

### Communication

| Skill | Description | CLI Tools |
|---|---|---|
| `c-email` | Read, send, search email (Gmail or IMAP) | `gog` `himalaya` |
| `c-calendar` | Events + scheduling (Google or Apple) | `gog` `icalpal` |
| `c-messaging` | iMessage + WhatsApp | `imsg` `wacli` |
| `c-slack` | Slack channels + DMs | `slack` |
| `c-social` | Twitter/X | `bird` |

### Media

| Skill | Description | CLI Tools |
|---|---|---|
| `c-music` | Spotify playback + search | `spogo` |
| `c-video` | YouTube download + convert | `yt-dlp` `ffmpeg` |
| `c-screen` | Screenshots, OCR, webcam | `peekaboo` `camsnap` |
| `c-voice` | Speech-to-text + TTS | `sag` `say` |

### Smart Home

| Skill | Description | CLI Tools |
|---|---|---|
| `c-lights` | Philips Hue control | `openhue` |
| `c-speakers` | Sonos speakers | `sonos` |
| `c-bluetooth` | Bluetooth devices | `blu` |

### Browser & Automation

| Skill | Description | CLI Tools |
|---|---|---|
| `c-browser` | Headless browser — navigate, click, scrape | [`agent-browser`](https://github.com/vercel-labs/agent-browser) / [`playwright`](https://playwright.dev/docs/cli) |
| `c-cron` | Cron jobs + launchctl services | `lunchy-go` |

### System & Files

| Skill | Description | CLI Tools |
|---|---|---|
| `c-system` | macOS Swiss Army Knife — volume, wifi, battery, dock | `m` |
| `c-apps` | Mac App Store from CLI | `mas` |
| `c-files` | Cloud sync — Google Drive, S3, Dropbox, 70+ providers | `rclone` |
| `c-display` | Display brightness + safe trash | `brightness` `trash` |
| `c-notify` | Native macOS notifications | `terminal-notifier` |

### Research & Utilities

| Skill | Description | CLI Tools |
|---|---|---|
| `c-research` | Summarize URLs, PDFs, videos | `summarize` |
| `c-location` | Apple Maps + nearby places | `goplaces` |
| `c-tracking` | Package tracking (UPS, FedEx, etc.) | `ordercli` |
| `c-secrets` | 1Password / Bitwarden | `op` `bw` |
| `c-network` | DNS lookups + HTTP client | `doggo` `http` |
| `c-ai` | Query LLMs — pipe text, chat, summarize | `llm` `aichat` |

### Developer

| Skill | Description | CLI Tools |
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
| `openpaw list` | Show all available skills |
| `openpaw add <skills>` | Add skills — `openpaw add notes music email` |
| `openpaw remove <skills>` | Remove skills |
| `openpaw status` | Show installed skills + tool versions |
| `openpaw doctor` | Diagnose issues |
| `openpaw update` | Upgrade CLI tools |
| `openpaw reset` | Remove everything OpenPaw installed |

---

## How It Works

OpenPaw doesn't run in the background. Here's what happens when you run the wizard:

```
1. You pick a preset or choose individual skills
2. Homebrew taps are added (steipete/tap, yakitrak/yakitrak, etc.)
3. CLI tools are installed via brew/npm/pip
4. SKILL.md files are created in ~/.claude/skills/c-*/
5. Bash permissions are added to ~/.claude/settings.json
6. A PreToolUse safety hook is installed
7. OpenPaw exits — Claude Code handles the rest
```

**Skills** are SKILL.md files that Claude Code auto-discovers at session start. They teach Claude how to use each CLI tool — what commands exist, what flags to use, and how to handle errors.

**Permissions** let Claude run CLI tools without prompting you every time. OpenPaw adds only the minimum permissions needed for the skills you selected.

**Safety hooks** block dangerous patterns like mass-delete, mass-email, and credential exposure.

---

## The `/c` Coordinator

Every OpenPaw install includes `c-core` — a coordinator skill that acts as the brain. It knows what skills are installed and routes your requests to the right tool.

Just type `/c` in Claude Code followed by what you need:

```
/c what emails came in today?
/c play something chill on spotify
/c add "buy groceries" to my reminders
/c search my obsidian vault for project ideas
```

---

## OpenPaw vs OpenClaw

|  | OpenClaw | OpenPaw |
|---|---|---|
| Cost | $5-750/mo on top of Claude | **$0 extra** — uses your Claude subscription |
| Setup | 15+ hours | **5 minutes** |
| Security | 3 critical CVEs, 40K exposed instances | **Zero attack surface** |
| Architecture | Daemon on port :18789 | **No daemon** |
| Malicious skills | 341 reported | **Community-vetted only** |
| Dependencies | Docker, agent runtime, cloud | **Just CLI tools** |

Same CLI tools. Same capabilities. None of the risk.

OpenClaw charges $5-750/mo **on top of** your Claude subscription to run a daemon that was [found to have critical security vulnerabilities](https://www.cve.org/CVERecord?id=CVE-2026-25253), with 40,000+ exposed instances and 341 malicious skills in their marketplace.

OpenPaw adds nothing to your bill. It installs CLI tools locally, writes config files, and gets out of the way. Your Claude subscription handles the rest.

---

## Contributing

Want to add a skill? It's simple:

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

MIT — do whatever you want with it.

Made with care by [@daxaur](https://github.com/daxaur)
