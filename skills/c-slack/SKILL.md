---
name: c-slack
description: Send messages and upload files to Slack channels using the `slack` CLI. Supports direct messages, channel posts, file uploads, and thread replies.
tags: [slack, messaging, communication, files]
---

## What This Skill Does

Enables Claude to send messages and share files to Slack channels and users via the `slack` CLI tool.

## Available CLI Tool: `slack`

### Common Commands

```bash
# Send a message to a channel
slack chat send --channel "#general" --text "Hello team"

# Send a direct message to a user
slack chat send --channel "@username" --text "Hey!"

# Upload a file to a channel
slack files upload --channel "#general" --file ./report.pdf --title "Weekly Report"

# Post with markdown formatting
slack chat send --channel "#dev" --text "*Bold* and _italic_ text"

# Reply in a thread (requires thread timestamp)
slack chat send --channel "#general" --thread-ts "1234567890.123456" --text "Reply here"

# List channels
slack channels list
```

## Usage Guidelines

- Always confirm the target channel or user before sending
- Use `#channel-name` syntax for channels and `@username` for DMs
- File uploads support PDF, images, text, and most common formats
- Keep messages concise; use threads for follow-ups

## Notes

- Requires `slack` CLI to be installed and authenticated (`slack auth`)
- Bot token must have `chat:write` and `files:write` scopes
- Rate limits apply — avoid bulk sending in tight loops
