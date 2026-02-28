---
name: c-files
description: Sync files to Google Drive, S3, Dropbox, OneDrive, and 70+ cloud providers using rclone.
tags: [files, cloud, sync, backup, storage]
---

# Cloud Files (rclone)

```bash
# List configured remotes
rclone listremotes

# List files in a remote
rclone ls remote:path
rclone lsd remote:path    # directories only

# Copy files to/from cloud
rclone copy local/path remote:path
rclone copy remote:path local/path

# Sync (make remote match local — deletes extra files on remote)
rclone sync local/path remote:path

# Move files
rclone move local/path remote:path

# Interactive file explorer
rclone ncdu remote:path

# Mount cloud storage as local folder
rclone mount remote:path /mnt/cloud --daemon

# Check for differences
rclone check local/path remote:path

# Show storage usage
rclone about remote:
```

## Setup

Run `rclone config` to add remotes. Supports:
- Google Drive, S3, Dropbox, OneDrive, Backblaze B2
- Azure Blob, SFTP, FTP, WebDAV
- 70+ providers total

## Guidelines

- `rclone sync` deletes files on destination — use `rclone copy` if unsure
- Always confirm before sync operations that delete remote files
- Use `--dry-run` flag to preview what would change
- Use `rclone check` to verify files match without transferring
