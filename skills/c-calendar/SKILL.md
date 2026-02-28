---
name: c-calendar
description: View and create calendar events via gog (Google Calendar) or icalBuddy (Apple Calendar). Check availability, list upcoming events, create/update/delete events, and manage multiple calendars.
tags: [calendar, google-calendar, apple-calendar, gog, icalBuddy, events]
---

This skill manages calendars via `gog` (Google Calendar) or `icalBuddy` (Apple Calendar). Check availability with `which gog icalBuddy`.

## Google Calendar — `gog cal` (gogcli)

```bash
gog cal list                               # List upcoming events
gog cal list --days 7                      # Next 7 days
gog cal list --calendar "Work"             # Specific calendar
gog cal list --start "2026-03-01" --end "2026-03-07"
gog cal get <event-id>                     # Get event details
gog cal create --title "Meeting" --start "2026-03-01T10:00" --end "2026-03-01T11:00"
gog cal create --title "Event" --start "tomorrow 2pm" --duration 1h --calendar "Work"
gog cal create --attendees "alice@x.com,bob@x.com" --title "Sync"
gog cal update <event-id> --title "New Title"
gog cal delete <event-id>
gog cal calendars                          # List all calendars
gog cal freebusy --start "tomorrow" --end "tomorrow 5pm"
```

## Apple Calendar — `icalBuddy`

```bash
icalBuddy eventsToday                        # Today's events
icalBuddy eventsToday+3                      # Events today through next 3 days
icalBuddy eventsFrom:"2026-03-01" to:"2026-03-07"
icalBuddy -ic "Work" eventsToday             # Specific calendar
icalBuddy calendars                          # List all calendars
icalBuddy uncompletedTasks                   # Incomplete reminders/tasks
```

## Usage Guidelines

- Use `gog cal freebusy` to check availability before scheduling.
- `icalBuddy` is read-only for Apple Calendar — use it for viewing, not creating.
- For creating Apple Calendar events programmatically, prefer `gog` with Google Calendar or use AppleScript via the `osascript` fallback.
- Dates accept natural language with `gog` ("tomorrow 2pm", "next Monday 9am").

## Notes

- `gog` requires Google OAuth: `gog auth`.
- `icalBuddy` reads directly from the local Calendar database (no auth needed).
- Multiple Google accounts supported via `gog cal --account work list`.
