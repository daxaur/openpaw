---
name: c-voice
description: Convert speech to text using `sag` (ElevenLabs STT) and synthesize speech using `say` (macOS built-in TTS). Enables voice input transcription and audio output.
tags: [voice, speech, tts, stt, elevenlabs, say, sag, audio]
---

## What This Skill Does

Enables Claude to transcribe spoken audio to text via `sag` (powered by ElevenLabs) and to speak text aloud using the macOS `say` command.

## Available CLI Tools

### `sag` — Speech-to-Text (ElevenLabs)

```bash
# Transcribe an audio file
sag transcribe --file recording.mp3

# Record from microphone and transcribe
sag record --output transcript.txt

# Transcribe with a specific language hint
sag transcribe --file audio.wav --language en

# Output transcript to stdout
sag transcribe --file audio.m4a --stdout
```

### `say` — Text-to-Speech (macOS built-in)

```bash
# Speak text aloud
say "Hello, how can I help you today?"

# Use a specific voice
say -v Samantha "Your report is ready."

# Save spoken audio to a file
say -o output.aiff "Text to synthesize"

# List available voices
say -v ?

# Control speaking rate (words per minute)
say -r 180 "Speaking at a custom rate"
```

## Usage Guidelines

- Use `sag` to process audio files the user provides or to capture mic input
- Use `say` to read back responses, summaries, or alerts aloud
- Prefer `say -v Samantha` or `-v Alex` for natural-sounding output on macOS

## Notes

- `sag` requires a valid ElevenLabs API key configured in environment
- `say` is built into macOS — no installation needed
- Supported audio input formats for `sag`: MP3, WAV, M4A, FLAC
