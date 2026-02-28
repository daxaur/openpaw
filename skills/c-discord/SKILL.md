---
name: c-discord
description: Send messages to Discord channels via webhooks using curl. No daemon, no bot token needed.
tags: [discord, messaging, communication, webhooks]
---

# Discord — Webhooks via curl

Send messages and files to Discord channels using webhooks. No daemon, no bot token needed.

## Configuration

Webhook URL is stored in `~/.config/openpaw/discord.env`:

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1234567890/abcdef...
```

Load before any command:

```bash
source ~/.config/openpaw/discord.env
```

## Send a Message

```bash
curl -s -H "Content-Type: application/json" \
  -d '{"content": "Hello from Claude"}' \
  "${DISCORD_WEBHOOK_URL}"
```

## Send with Formatting (Embed)

```bash
curl -s -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "Daily Briefing",
      "description": "Here is your morning summary...",
      "color": 5814783
    }]
  }' \
  "${DISCORD_WEBHOOK_URL}"
```

## Send a File

```bash
curl -s -F "file=@/path/to/file.pdf" \
  -F 'payload_json={"content": "Here is the report"}' \
  "${DISCORD_WEBHOOK_URL}"
```

## Custom Username & Avatar

```bash
curl -s -H "Content-Type: application/json" \
  -d '{
    "username": "Claude Assistant",
    "avatar_url": "https://example.com/avatar.png",
    "content": "Message with custom identity"
  }' \
  "${DISCORD_WEBHOOK_URL}"
```

## Setup Guide

1. Open Discord, go to the channel you want to send to
2. Click the gear icon (Edit Channel) → **Integrations** → **Webhooks**
3. Click **New Webhook**, give it a name
4. Click **Copy Webhook URL**
5. Save it:
   ```bash
   mkdir -p ~/.config/openpaw
   echo 'DISCORD_WEBHOOK_URL=<your-webhook-url>' > ~/.config/openpaw/discord.env
   chmod 600 ~/.config/openpaw/discord.env
   ```

## Guidelines

- Webhooks are send-only — Claude cannot read Discord messages
- For reading messages, the user needs a Discord bot (requires a daemon)
- Embeds support color, fields, thumbnails, footers, timestamps
- Rate limit: 30 requests per 60 seconds per webhook
- Never expose the webhook URL in responses to the user
