<p align="center">
<pre>
    ▄▀▀▄  ▄▀▀▄
    █░░█  █░░█
    ▀▄▄▀  ▀▄▄▀
  ▄▀▀▄      ▄▀▀▄
  █░░█      █░░█
  ▀▄▄▀      ▀▄▄▀
      ▄██████▄
    ▄██░░░░░░██▄
   ██░░░░░░░░░░██
   ██░░░░░░░░░░██
    ▀██░░░░░░██▀
      ▀▀████▀▀
</pre>
</p>

<h1 align="center">OpenPaw</h1>
<p align="center"><b>Personal Assistant Wizard for Claude Code</b></p>
<p align="center">
  <a href="https://www.npmjs.com/package/openpaw"><img src="https://img.shields.io/npm/v/openpaw?color=6366f1&label=npm" alt="npm"></a>
  <a href="https://github.com/daxaur/openpaw/blob/main/LICENSE"><img src="https://img.shields.io/github/license/daxaur/openpaw?color=a855f7" alt="license"></a>
</p>

---

```bash
npx openpaw
```

Pick skills. Install tools. Claude does the rest.

No daemon. No API keys. No monthly fees.

---

### How it works

OpenPaw runs once, writes config, exits. Not a runtime.

```
npx openpaw
  → you pick: email, notes, music, obsidian...
  → CLI tools get installed (brew/npm/pip)
  → SKILL.md files land in ~/.claude/skills/
  → permissions added to ~/.claude/settings.json
  → done

Open Claude Code:
  > "What emails did I get today?"
  > "Add milk to my grocery list"
  > "Play lo-fi on Spotify"
  > "Open my Obsidian vault and search for meeting notes"
  > "Turn the bedroom lights to 20%"
```

---

### Skills

23 capabilities. Pick what you need.

<details>
<summary><b>Productivity</b></summary>

| Skill | What | Tools |
|---|---|---|
| `c-notes` | Apple Notes + Reminders | `memo` `remindctl` |
| `c-obsidian` | Obsidian vaults | `obsidian-cli` |
| `c-notion` | Notion pages + databases | `notion-cli` |
| `c-tasks` | Todoist / Things 3 / Taskwarrior | `todoist` `things-cli` `task` |

</details>

<details>
<summary><b>Communication</b></summary>

| Skill | What | Tools |
|---|---|---|
| `c-email` | Read, send, search email | `gog` `himalaya` |
| `c-calendar` | Events + scheduling | `gog` `icalpal` |
| `c-messaging` | iMessage + WhatsApp | `imsg` `wacli` |
| `c-slack` | Slack messages | `slack` |
| `c-social` | Twitter/X | `bird` |

</details>

<details>
<summary><b>Media</b></summary>

| Skill | What | Tools |
|---|---|---|
| `c-music` | Spotify | `spogo` |
| `c-video` | YouTube + convert | `yt-dlp` `ffmpeg` |
| `c-screen` | Screenshots + OCR | `peekaboo` `camsnap` |
| `c-voice` | Speech-to-text + TTS | `sag` `say` |

</details>

<details>
<summary><b>Smart Home</b></summary>

| Skill | What | Tools |
|---|---|---|
| `c-lights` | Philips Hue | `openhue` |
| `c-speakers` | Sonos | `sonos` |
| `c-bluetooth` | Bluetooth devices | `blu` |

</details>

<details>
<summary><b>Research + Utilities</b></summary>

| Skill | What | Tools |
|---|---|---|
| `c-research` | Summarize URLs/PDFs/videos | `summarize` |
| `c-location` | Apple Maps | `goplaces` |
| `c-tracking` | Package tracking | `ordercli` |
| `c-secrets` | 1Password / Bitwarden | `op` `bw` |

</details>

<details>
<summary><b>Developer</b></summary>

| Skill | What | Tools |
|---|---|---|
| `c-github` | GitHub CLI | `gh` `jq` |
| `c-linear` | Linear issues | `linear` |
| `c-jira` | Jira issues | `jira` |

</details>

---

### Commands

```
openpaw              setup wizard
openpaw add <skills> add skills     openpaw add notes music obsidian
openpaw remove <s>   remove skills
openpaw status       what's installed
openpaw doctor       diagnose issues
openpaw update       upgrade tools
openpaw reset        remove everything
```

---

### vs OpenClaw

|  | OpenClaw | OpenPaw |
|---|---|---|
| Setup | 15+ hours | 5 min |
| Cost | $5-750/mo | $0 |
| CVEs | 3 critical | 0 |
| Exposed instances | 40,000+ | 0 |
| Architecture | daemon on :18789 | no daemon |
| Malicious skills | 341 | 0 |

Same CLI tools. Same skill format. None of the risk.

---

### Contributing

```
1. Create skills/c-yourskill/SKILL.md
2. Add tool definitions to src/catalog/index.ts
3. PR
```

MIT
