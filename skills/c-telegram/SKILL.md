---
name: c-telegram
description: Send and read Telegram messages via tg CLI. Supports chats, groups, channels, file sharing, and message history.
tags: [telegram, messaging, communication, chat]
---

## Telegram — `tg`

Send and read Telegram messages from the command line.

### Commands

```bash
# Send a message
tg send "Chat Name" "Hello!"
tg send "@username" "Hey there"

# Read recent messages
tg history "Chat Name" --limit 20
tg history "@username"

# List chats
tg chats

# Send a file
tg send "Chat Name" --file ./document.pdf
tg send "Chat Name" --photo ./image.png

# Search messages
tg search "keyword" --chat "Chat Name"

# Unread messages
tg unread
```

### Usage Guidelines

- Use chat name or @username to identify recipients
- Check `tg unread` for new messages before replying
- File sends support photos, documents, videos, and audio
- Group chats are referenced by their name

### Setup

First-time auth: `tg auth` — enter phone number and verification code.

### Notes

- Requires a Telegram account with a phone number
- API credentials are stored locally after first auth
- Rate limits apply — avoid bulk messaging
