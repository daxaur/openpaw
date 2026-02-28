---
name: c-github
description: Interact with GitHub using the `gh` CLI and `jq`. Manage PRs, issues, repositories, and Actions workflows. Make raw API calls with `gh api` for anything not covered by built-in commands.
tags: [github, git, prs, issues, actions, ci, repos, api]
---

## What This Skill Does

Uses `gh` (GitHub CLI) and `jq` to manage GitHub resources including pull requests, issues, repositories, and Actions. Supports raw API calls for advanced queries.

## CLI Tools: `gh` + `jq`

### Pull Requests

```bash
gh pr list                          # List open PRs
gh pr view 123                      # View PR details
gh pr create --title "Fix bug" --body "..." --base main
gh pr merge 123 --squash
gh pr checkout 123
gh pr review 123 --approve
```

### Issues

```bash
gh issue list --state open
gh issue view 42
gh issue create --title "Bug" --body "..." --label bug
gh issue close 42
gh issue comment 42 --body "Fixed in #123"
```

### Actions / CI

```bash
gh run list                         # List recent workflow runs
gh run view 123456789               # View run details
gh run watch                        # Watch current run live
gh workflow run deploy.yml
```

### API Calls with `jq`

```bash
gh api repos/{owner}/{repo}/pulls | jq '.[].title'
gh api /user/repos | jq '.[].full_name'
gh api graphql -f query='{ viewer { login } }'
```

## Usage Guidelines

1. Default to the current repo context when no `--repo` flag is specified.
2. Use `jq` to filter and format `gh api` JSON output for readability.
3. For bulk operations, pipe `gh issue list --json number,title` into `jq`.
4. Always confirm before closing issues or merging PRs.

## Notes

- Requires `gh auth login` to be completed before use.
- Install: `brew install gh` and `brew install jq`
