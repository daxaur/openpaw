---
name: c-discord
description: Send messages and manage Discord servers via discord-cli. Supports channels, DMs, file uploads, and server management.
tags: [discord, messaging, communication, chat, gaming]
---

## Discord — `discord`

Send and read Discord messages from the command line.

### Commands

```bash
# Send a message to a channel
discord send "#general" "Hello everyone!"
discord send --channel-id 123456789 "Hello!"

# Send a DM
discord dm "@username" "Hey!"

# Read recent messages
discord history "#general" --limit 20
discord history --channel-id 123456789

# List servers and channels
discord servers
discord channels --server "My Server"

# Upload a file
discord send "#general" --file ./screenshot.png

# Search messages
discord search "keyword" --channel "#general"
```

### Usage Guidelines

- Reference channels with #channel-name or channel IDs
- Use @username for DMs
- File uploads support images, documents, and media
- Respect server rules and rate limits

### Setup

First-time auth: `discord auth` — authenticate with your Discord token.

### Notes

- Requires a Discord account
- Bot tokens or user tokens can be used (bot recommended for automation)
- Respects Discord's rate limits and TOS
