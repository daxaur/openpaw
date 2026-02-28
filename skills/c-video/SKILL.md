---
name: c-video
description: Download videos, extract audio, convert formats, and clip segments using `yt-dlp` and `ffmpeg`. Supports YouTube, Vimeo, and hundreds of other sites.
tags: [video, audio, download, yt-dlp, ffmpeg, conversion]
---

## What This Skill Does

Enables Claude to download online videos, extract audio tracks, convert between formats, and cut/clip video segments using `yt-dlp` and `ffmpeg`.

## Available CLI Tools

### `yt-dlp` — Video Downloading

```bash
# Download a video (best quality)
yt-dlp "https://youtube.com/watch?v=ID"

# Download audio only as MP3
yt-dlp -x --audio-format mp3 "https://youtube.com/watch?v=ID"

# Download specific format/resolution
yt-dlp -f "bestvideo[height<=1080]+bestaudio" "URL"

# Download to specific output path
yt-dlp -o "~/Downloads/%(title)s.%(ext)s" "URL"

# List available formats
yt-dlp -F "URL"
```

### `ffmpeg` — Processing & Conversion

```bash
# Convert video format
ffmpeg -i input.mp4 output.webm

# Extract audio from video
ffmpeg -i input.mp4 -vn -acodec mp3 output.mp3

# Clip a segment (start time, duration)
ffmpeg -i input.mp4 -ss 00:01:30 -t 00:00:45 -c copy clip.mp4

# Resize video
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4
```

## Usage Guidelines

- Confirm the output directory before downloading large files
- Use `-x` with `yt-dlp` for audio-only extraction instead of downloading video first

## Notes

- Only download content you have rights to use
- `yt-dlp` may need periodic updates: `pip install -U yt-dlp`
