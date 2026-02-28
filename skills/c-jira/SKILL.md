---
name: c-jira
description: Manage Jira issues using `jira` (jira-cli). List and filter issues, create new tickets, transition issue status, manage sprints, and add comments — all from the terminal without opening a browser.
tags: [jira, issues, project-management, sprints, tickets, atlassian]
---

## What This Skill Does

Uses `jira` (jira-cli) to interact with Jira projects — listing issues, creating tickets, moving issues through workflow transitions, and managing sprints.

## CLI Tool: `jira`

### List & View Issues

```bash
jira issue list                             # List issues assigned to you
jira issue list --project MYPROJ            # Filter by project
jira issue list --status "In Progress"      # Filter by status
jira issue list --type Bug                  # Filter by issue type
jira issue view MYPROJ-123                  # View issue details
```

### Create Issues

```bash
jira issue create \
  --project MYPROJ \
  --type Bug \
  --summary "Login page throws 500 error" \
  --body "Steps to reproduce: ..." \
  --priority High \
  --label backend
```

### Transitions

```bash
jira issue move MYPROJ-123 "In Progress"
jira issue move MYPROJ-123 "Done"
jira issue move MYPROJ-123 "In Review"
```

### Comments

```bash
jira issue comment add MYPROJ-123 --body "Fixed in PR #456"
```

### Sprints

```bash
jira sprint list --project MYPROJ           # List sprints
jira sprint add MYPROJ-123 --sprint 42      # Add issue to sprint
```

## Usage Guidelines

1. Always use the full issue key (e.g., `MYPROJ-123`) in commands.
2. Run `jira issue list` before creating tickets to check for existing duplicates.
3. Use `jira issue move` to transition issues — confirm the valid transition names with `jira issue view` first.
4. When the user says "close" or "resolve" an issue, use the appropriate transition name for their workflow.

## Notes

- Requires `jira init` to configure server URL and credentials before use.
- Install: `brew install ankitpokhrel/jira-cli/jira-cli`
