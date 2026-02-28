---
name: c-lights
description: Control Philips Hue smart lights using the `openhue` CLI. Turn lights on/off, adjust brightness and color, activate scenes, and manage rooms and groups.
tags: [hue, lights, smart-home, openhue, philips, automation]
---

## What This Skill Does

Enables Claude to control Philips Hue smart lighting — individual bulbs, rooms, and scenes — using the `openhue` CLI.

## Available CLI Tool: `openhue`

### Common Commands

```bash
# List all lights
openhue get lights

# List all rooms/groups
openhue get rooms

# Turn a light on or off
openhue set light "Desk Lamp" --on
openhue set light "Desk Lamp" --off

# Set brightness (0-100)
openhue set light "Bedroom" --brightness 75

# Set color by name or hex
openhue set light "Living Room" --color red
openhue set light "Living Room" --color "#FF6600"

# Set color temperature (warm to cool, in mirek)
openhue set light "Kitchen" --color-temp 370

# Control an entire room
openhue set room "Living Room" --on --brightness 80

# List available scenes
openhue get scenes

# Activate a scene
openhue set scene "Relax" --room "Living Room"
```

## Usage Guidelines

- Use room-level commands when the user refers to a space, not a specific bulb
- Brightness is 0–100; color-temp ranges roughly 153 (cool) to 500 (warm)
- List lights/rooms first if unsure of exact names

## Notes

- Requires `openhue` configured with your Hue Bridge IP and API key
- Bridge must be on the same local network
