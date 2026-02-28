---
name: c-social
description: Post tweets, read timelines, search, and reply on Twitter/X using the `bird` CLI. Supports text posts, media attachments, quote tweets, and user lookups.
tags: [twitter, x, social-media, bird, posting]
---

## What This Skill Does

Enables Claude to interact with Twitter/X — posting, reading, searching, and replying — via the `bird` CLI.

## Available CLI Tool: `bird`

### Common Commands

```bash
# Post a tweet
bird tweet post "Hello world!"

# Post with media
bird tweet post "Check this out" --media ./image.png

# Read your home timeline
bird timeline home

# Read a user's timeline
bird timeline user --username elonmusk

# Search tweets
bird search "openai announcement" --limit 10

# Reply to a tweet
bird tweet reply --id 1234567890 --text "Great point!"

# Quote tweet
bird tweet quote --id 1234567890 --text "Adding context here"

# Like a tweet
bird tweet like --id 1234567890

# Get your own profile info
bird user me

# Look up a user
bird user get --username sama
```

## Usage Guidelines

- Keep tweets under 280 characters; check length before posting
- Search results are newest-first by default
- Always confirm content before posting on behalf of the user

## Notes

- Requires `bird` CLI authenticated with Twitter API v2 credentials
- Media uploads support JPG, PNG, GIF, and MP4
- Rate limits: 50 tweets/day on free tier; check before bulk posting
