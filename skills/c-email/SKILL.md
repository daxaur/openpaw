---
name: c-email
description: Read, send, search, and label email via gog (Gmail CLI) or himalaya (IMAP). Supports inbox management, drafting replies, thread viewing, and label/folder operations across Gmail and standard IMAP accounts.
tags: [email, gmail, imap, gog, himalaya, inbox]
---

This skill manages email via `gog` (Gmail) or `himalaya` (IMAP). Check availability with `which gog himalaya`.

## Gmail — `gog mail` (gogcli)

```bash
gog mail list                              # List inbox messages
gog mail list --label "INBOX" --max 20
gog mail read <message-id>                 # Read a message
gog mail send --to "user@example.com" --subject "Subject" --body "Body"
gog mail reply <message-id> --body "Reply text"
gog mail search "from:alice subject:report"
gog mail search "is:unread after:2026/02/01"
gog mail label add <message-id> "Label"
gog mail label remove <message-id> "INBOX"
gog mail archive <message-id>
gog mail trash <message-id>
gog mail labels                            # List all labels
gog mail thread <thread-id>                # View full thread
```

## IMAP — `himalaya`

```bash
himalaya list                              # List inbox
himalaya list -m 50                        # List last 50 messages
himalaya read <id>                         # Read message
himalaya write                             # Compose new message (interactive)
himalaya send --to "user@example.com" --subject "Subj" < body.txt
himalaya reply <id>
himalaya forward <id>
himalaya search "subject:report"
himalaya move <id> "Archive"               # Move to folder
himalaya delete <id>
himalaya folders                           # List folders
himalaya --account work list               # Use a specific account
```

## Usage Guidelines

- Prefer `gog` for Gmail accounts; prefer `himalaya` for non-Gmail IMAP.
- Use `gog mail search` with Gmail search syntax (from:, to:, subject:, is:unread, has:attachment).
- For sending with body content, pass the body directly or pipe a file.
- Both tools require prior authentication setup.

## Notes

- `gog` requires Google OAuth configured via `gog auth`.
- `himalaya` requires IMAP credentials in `~/.config/himalaya/config.toml`.
