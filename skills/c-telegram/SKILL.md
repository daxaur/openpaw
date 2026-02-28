---
name: c-telegram
description: Send and read Telegram messages via Bot API using curl. No daemon needed — works on demand.
tags: [telegram, messaging, communication, bot]
---

# Telegram — Bot API via curl

Send and read Telegram messages using the Bot API. No extra tools needed — just curl.

## Configuration

Bot credentials are stored in `~/.config/openpaw/telegram.env`:

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=123456789
```

Load them before any command:

```bash
source ~/.config/openpaw/telegram.env
```

## Send a Message

```bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=Hello from Claude" \
  -d "parse_mode=Markdown"
```

## Read Recent Messages

```bash
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=10" | jq '.result[-5:][] | {from: .message.from.first_name, text: .message.text, date: .message.date}'
```

## Send a File

```bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" \
  -F "chat_id=${TELEGRAM_CHAT_ID}" \
  -F "document=@/path/to/file.pdf"
```

## Send a Photo

```bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto" \
  -F "chat_id=${TELEGRAM_CHAT_ID}" \
  -F "photo=@/path/to/image.png" \
  -F "caption=Here's the screenshot"
```

## Setup Guide

The user needs to create a Telegram bot once:

1. Open Telegram and message `@BotFather`
2. Send `/newbot`, pick a name and username (must end in `bot`)
3. Copy the **API token** BotFather gives you
4. Send any message to your new bot in Telegram (creates the chat)
5. Get your chat ID:
   ```bash
   curl -s "https://api.telegram.org/bot<TOKEN>/getUpdates" | jq '.result[0].message.chat.id'
   ```
6. Save credentials:
   ```bash
   mkdir -p ~/.config/openpaw
   echo 'TELEGRAM_BOT_TOKEN=<your-token>' > ~/.config/openpaw/telegram.env
   echo 'TELEGRAM_CHAT_ID=<your-chat-id>' >> ~/.config/openpaw/telegram.env
   chmod 600 ~/.config/openpaw/telegram.env
   ```

## Guidelines

- Always load credentials with `source ~/.config/openpaw/telegram.env` first
- Use Markdown parse_mode for formatted messages
- Check `getUpdates` to read what the user sent to the bot
- Never expose the bot token in responses to the user
- Rate limit: max ~30 messages/second to same chat
