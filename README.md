# OpenPaw

**Personal Assistant Wizard for Claude Code**

Turn Claude Code into a full personal assistant. Pick skills, install CLI tools, and start asking Claude to manage your email, notes, calendar, music, smart home, and more.

```
npx openpaw
```

One command. No daemon. No API keys. No monthly fees.

---

## Why

[OpenClaw](https://github.com/openclaw/openclaw) proved that an AI personal assistant with installable skills is a great idea. But it comes with:

- Security nightmares (CVE-2026-25253, 40K exposed instances, 341 malicious skills)
- $5-750/mo in API costs
- A complex daemon architecture
- 15+ hour setup time

**OpenPaw** takes the same concept and runs it through Claude Code instead — which already has a sandbox, permission system, and your subscription.

| | OpenClaw | OpenPaw |
|---|---|---|
| Setup time | 15+ hours | 5 minutes |
| Monthly cost | $5-750 (API keys) | $0 (uses Claude Code sub) |
| Security CVEs | 3 critical | 0 |
| Exposed instances | 40,000+ | 0 (no daemon) |
| Architecture | Always-on daemon | No daemon — just skills |

## How It Works

OpenPaw is a **setup wizard**, not a runtime. It runs once, configures everything, then gets out of the way.

1. **You pick skills** — notes, email, music, smart home, whatever you want
2. **It installs CLI tools** — via Homebrew, npm, or pip
3. **It creates skill files** — `~/.claude/skills/c-*/SKILL.md` that teach Claude how to use each tool
4. **It configures permissions** — so Claude can run tools without prompting every time
5. **Done.** Open Claude Code and talk naturally.

After setup, Claude just knows things:

```
> What are my latest emails?          → runs gog mail list
> Add milk to my grocery reminders    → runs remindctl add --list Grocery "milk"
> Play some jazz on Spotify           → runs spogo play jazz
> Summarize this YouTube video        → runs summarize <url>
> Turn the living room lights blue    → runs openhue set --room "Living Room" --color blue
```

## Available Skills

### Productivity
- **c-notes** — Apple Notes & Reminders (`memo`, `remindctl`)
- **c-obsidian** — Obsidian vault management (`obsidian-cli`)
- **c-notion** — Notion pages & databases (`notion-cli`)
- **c-tasks** — Todoist, Things 3, or Taskwarrior

### Communication
- **c-email** — Gmail (`gogcli`) or IMAP (`himalaya`)
- **c-calendar** — Google Calendar (`gogcli`) or Apple Calendar (`icalpal`)
- **c-messaging** — iMessage (`imsg`) & WhatsApp (`wacli`)
- **c-slack** — Slack messaging (`slack-cli`)
- **c-social** — Twitter/X (`bird`)

### Media
- **c-music** — Spotify (`spogo`)
- **c-video** — YouTube & video processing (`yt-dlp`, `ffmpeg`)
- **c-screen** — Screenshots & OCR (`peekaboo`, `camsnap`)
- **c-voice** — Speech-to-text & TTS (`sag`, `say`)

### Smart Home
- **c-lights** — Philips Hue (`openhue`)
- **c-speakers** — Sonos (`sonoscli`)
- **c-bluetooth** — Bluetooth devices (`blucli`)

### Research & Utilities
- **c-research** — Summarize URLs/PDFs/videos (`summarize`)
- **c-location** — Apple Maps & places (`goplaces`)
- **c-tracking** — Package tracking (`ordercli`)
- **c-secrets** — 1Password (`op`) or Bitwarden (`bw`)

### Developer
- **c-github** — GitHub CLI (`gh`, `jq`)
- **c-linear** — Linear issues (`linear-cli`)
- **c-jira** — Jira issues (`jira-cli`)

## Commands

```bash
npx openpaw              # Interactive setup wizard
npx openpaw setup        # Same as above
npx openpaw add <skills> # Add skills: openpaw add notes music email
npx openpaw remove <skills>  # Remove skills
npx openpaw status       # Show installed skills & tool versions
npx openpaw doctor       # Diagnose issues
npx openpaw update       # Update CLI tools via Homebrew
npx openpaw reset        # Remove all skills & permissions
```

## Platform Support

Most skills work on macOS. Some work cross-platform:

| Platform | Available Skills |
|----------|-----------------|
| macOS | All 23 skills |
| Linux | email, calendar, social, music, video, lights, speakers, research, tracking, secrets, github, linear, jira, obsidian, notion, tasks (todoist/taskwarrior) |
| Windows | email, social, music, video, lights, speakers, research, tracking, secrets, github, linear, obsidian, notion |

## How It Connects to Claude Code

OpenPaw writes three things:

1. **Skill files** (`~/.claude/skills/c-*/SKILL.md`) — Claude Code auto-discovers these at session start
2. **Permissions** (`~/.claude/settings.json`) — Pre-authorizes CLI tool commands so Claude doesn't prompt every time
3. **Safety hooks** — Blocks dangerous patterns (mass-delete, mass-send)

That's it. No daemon, no server, no ports, no processes. Just files on disk that Claude Code reads.

## Contributing

PRs welcome! To add a new skill:

1. Fork the repo
2. Create `skills/c-yourskill/SKILL.md` with YAML frontmatter + instructions
3. Add the skill definition to `src/catalog/index.ts`
4. Submit a PR

## License

MIT
