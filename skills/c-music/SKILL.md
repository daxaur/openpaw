---
name: c-music
description: Control Spotify playback using the `spogo` CLI. Play, pause, skip, search tracks/albums/playlists, manage the queue, and browse your library.
tags: [spotify, music, playback, spogo, audio]
---

## What This Skill Does

Enables Claude to control Spotify playback and search music via the `spogo` CLI tool.

## Available CLI Tool: `spogo`

### Common Commands

```bash
# Play/pause toggle
spogo play
spogo pause

# Skip to next or previous track
spogo next
spogo prev

# Search and play a track
spogo search track "Bohemian Rhapsody" --play

# Search an album and play it
spogo search album "Dark Side of the Moon" --play

# Search playlists
spogo search playlist "chill vibes"

# Play a specific playlist by name or URI
spogo playlist play "My Playlist"

# Add current track to queue
spogo queue add "spotify:track:TRACK_ID"

# Show current playback status
spogo status

# Set volume (0-100)
spogo volume 60

# List your saved playlists
spogo playlist list
```

## Usage Guidelines

- Use `spogo status` first to check what is currently playing
- When searching, confirm the result with the user before playing if ambiguous
- Volume is a 0–100 integer scale

## Notes

- Requires `spogo` configured with Spotify OAuth credentials
- Playback requires an active Spotify Premium account
- Spotify must be open on at least one device for commands to work
