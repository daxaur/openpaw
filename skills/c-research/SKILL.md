---
name: c-research
description: Summarize web URLs, PDFs, YouTube videos, and podcasts using the `summarize` CLI. Instantly extract key points from any content type without manual reading. Useful for research, link digests, and media review.
tags: [research, summarize, ai, youtube, pdf, web, podcast]
---

## What This Skill Does

Uses the `summarize` CLI to extract key information from URLs, PDFs, YouTube videos, and podcast feeds. Returns a concise summary of the content.

## CLI Tool: `summarize`

### Common Commands

```bash
# Summarize a web URL
summarize https://example.com/article

# Summarize a PDF (local file or URL)
summarize /path/to/document.pdf
summarize https://example.com/report.pdf

# Summarize a YouTube video
summarize https://www.youtube.com/watch?v=VIDEO_ID

# Summarize a podcast episode
summarize https://podcast-feed-url.com/episode.mp3

# Request a specific output format
summarize --format bullets https://example.com/article
summarize --format paragraph https://example.com/article
```

## Usage Guidelines

1. Always pass the full URL or absolute file path.
2. For YouTube, use the full `watch?v=` URL — short links may not resolve.
3. If the user asks to "look up", "read", or "check" a link, default to summarizing it.
4. Present the summary in a clean, readable format — use bullet points for articles, prose for videos/podcasts.

## Notes

- Requires an active internet connection for remote content.
- Very large PDFs may take longer to process.
- If `summarize` is not installed, check the project docs for the install method.
