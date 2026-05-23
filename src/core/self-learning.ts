import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readSettings, writeSettings } from "./permissions.js";

const HOOKS_DIR = path.join(os.homedir(), ".claude", "openpaw-hooks");
const SCRIPT_PATH = path.join(HOOKS_DIR, "session-learn.sh");
export const LEARNINGS_FILE = path.join(
	os.homedir(),
	".claude",
	"memory",
	"learnings.md",
);

// Stop-hook script. A cheap deterministic gate decides whether a session is
// worth remembering; only then does it spend one small `claude -p` call to
// distill an atomic learning into ~/.claude/memory/learnings.md. It never
// stores secrets or full transcripts. Disable anytime with OPENPAW_SELF_LEARNING=off.
const LEARN_SCRIPT = `#!/bin/bash
# OpenPaw self-learning hook (Stop event) — turns sessions into durable memory.
# Cheap heuristic gate -> one small \`claude -p\` distillation -> append an
# atomic, dated learning to ~/.claude/memory/learnings.md.
# Never stores secrets or full transcripts. Disable: export OPENPAW_SELF_LEARNING=off
# Installed by: npx openpaw
set -euo pipefail
[ "\${OPENPAW_SELF_LEARNING:-on}" = "off" ] && exit 0

MEM_DIR="$HOME/.claude/memory"
LEARN_FILE="$MEM_DIR/learnings.md"
LOG="$HOME/.claude/logs/openpaw-self-learning.log"
mkdir -p "$MEM_DIR" "$(dirname "$LOG")"

INPUT=$(cat)
if command -v jq >/dev/null 2>&1; then
  TRANSCRIPT=$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty')
  STOP_ACTIVE=$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false')
  SESSION=$(printf '%s' "$INPUT" | jq -r '.session_id // "unknown"')
else
  TRANSCRIPT=$(printf '%s' "$INPUT" | grep -o '"transcript_path":"[^"]*"' | head -1 | sed 's/.*:"//;s/"$//')
  STOP_ACTIVE=$(printf '%s' "$INPUT" | grep -o '"stop_hook_active":[a-z]*' | head -1 | sed 's/.*://')
  SESSION=$(printf '%s' "$INPUT" | grep -o '"session_id":"[^"]*"' | head -1 | sed 's/.*:"//;s/"$//')
fi

# Guard 1: never loop inside a Stop-hook continuation. Guard 2: need a transcript.
[ "$STOP_ACTIVE" = "true" ] && exit 0
[ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ] || exit 0

# ---- CHEAP HEURISTIC GATE (no LLM) ----
TOOL_CALLS=$(grep -c '"type":"tool_use"' "$TRANSCRIPT" 2>/dev/null || true); TOOL_CALLS=\${TOOL_CALLS:-0}
ERROR_HITS=$(grep -c '"is_error":true' "$TRANSCRIPT" 2>/dev/null || true); ERROR_HITS=\${ERROR_HITS:-0}
CORRECTION=$(grep -iE '"role":"user"' "$TRANSCRIPT" 2>/dev/null \\
  | grep -icE "no,? (that|you|dont)|actually|thats wrong|not what i|incorrect|undo that|you broke" \\
  || true); CORRECTION=\${CORRECTION:-0}

WORTH=0
[ "$TOOL_CALLS" -ge 5 ] && WORTH=1
[ "$ERROR_HITS" -ge 1 ] && WORTH=1
[ "$CORRECTION" -ge 1 ] && WORTH=1
if [ "$WORTH" -eq 0 ]; then
  echo "$(date -Iseconds) skip session=$SESSION tools=$TOOL_CALLS err=$ERROR_HITS corr=$CORRECTION" >> "$LOG"
  exit 0
fi

# Needs the host CLI to distill. (Every Claude Code user has it.)
command -v claude >/dev/null 2>&1 || { echo "$(date -Iseconds) no-claude-cli session=$SESSION" >> "$LOG"; exit 0; }

# Feed only the last ~150 events, secrets stripped first.
TAIL=$(tail -n 150 "$TRANSCRIPT" | sed -E 's/(sk-ant-[A-Za-z0-9_-]{12,}|sk-or-v1-[A-Za-z0-9_-]{12,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|ghu_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]+|ntn_[A-Za-z0-9]+|eyJ[A-Za-z0-9_.-]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{40,})/[REDACTED]/g')

PROMPT="You are OpenPaw's self-learning summarizer. Below is the tail of a Claude Code session transcript (secrets already redacted).

Decide if this session produced a DURABLE, reusable learning: a recovered gotcha, a non-obvious workflow that worked, a behavioral correction from the user, or a fact worth remembering. If it is routine chatter, output exactly: SKIP

If worth saving, output EXACTLY two lines, no preamble:
LEARNING: <one tight, atomic, self-contained sentence — the takeaway only>
BEHAVIORAL: <yes if it is a correction/preference about how the assistant should behave, else no>

Rules: no secrets, no transcript dumps. One learning max. Be terse.

=== TRANSCRIPT TAIL ===
$TAIL"

RESULT=$(printf '%s' "$PROMPT" | claude -p --model haiku 2>>"$LOG" || echo SKIP)
if printf '%s' "$RESULT" | grep -q '^SKIP'; then
  echo "$(date -Iseconds) llm-skip session=$SESSION" >> "$LOG"
  exit 0
fi

LEARNING=$(printf '%s' "$RESULT" | grep -m1 '^LEARNING:' | sed 's/^LEARNING:[[:space:]]*//')
BEHAV=$(printf '%s' "$RESULT" | grep -m1 '^BEHAVIORAL:' | sed 's/^BEHAVIORAL:[[:space:]]*//' | tr 'A-Z' 'a-z')
[ -n "$LEARNING" ] || { echo "$(date -Iseconds) empty session=$SESSION" >> "$LOG"; exit 0; }

DATE=$(date +%F)
if [ ! -f "$LEARN_FILE" ]; then
  printf '# Learnings\\n\\nAtomic, dated takeaways OpenPaw captured from sessions. Newest at the bottom.\\n' > "$LEARN_FILE"
fi
TAG="learning"; [ "$BEHAV" = "yes" ] && TAG="behavior"
printf -- '\\n- **%s** [%s] %s _(session %s)_\\n' "$DATE" "$TAG" "$LEARNING" "$(printf '%s' "$SESSION" | cut -c1-8)" >> "$LEARN_FILE"
echo "$(date -Iseconds) appended session=$SESSION behav=$BEHAV" >> "$LOG"
exit 0
`;

function hasOpenPawStopHook(stopHooks: unknown[]): boolean {
	return (
		Array.isArray(stopHooks) &&
		stopHooks.some((h: unknown) => {
			if (typeof h === "object" && h !== null && "hooks" in h) {
				const hooks = (h as { hooks: unknown[] }).hooks;
				return (
					Array.isArray(hooks) &&
					hooks.some(
						(inner: unknown) =>
							typeof inner === "object" &&
							inner !== null &&
							"command" in inner &&
							String((inner as { command: string }).command).includes(
								"session-learn",
							),
					)
				);
			}
			return false;
		})
	);
}

export function selfLearningInstalled(): boolean {
	if (!fs.existsSync(SCRIPT_PATH)) return false;
	const settings = readSettings();
	const stopHooks = (settings.hooks as Record<string, unknown[]>)?.Stop ?? [];
	return hasOpenPawStopHook(stopHooks as unknown[]);
}

export function installSelfLearning(): boolean {
	try {
		fs.mkdirSync(HOOKS_DIR, { recursive: true });
		fs.writeFileSync(SCRIPT_PATH, LEARN_SCRIPT, { mode: 0o755 });

		const settings = readSettings();
		if (!settings.hooks) settings.hooks = {};
		const hooks = settings.hooks as Record<string, unknown[]>;
		const stopHooks = (hooks.Stop ?? []) as unknown[];

		if (!hasOpenPawStopHook(stopHooks)) {
			stopHooks.push({
				hooks: [{ type: "command", command: SCRIPT_PATH, timeout: 120 }],
			});
			hooks.Stop = stopHooks;
			writeSettings(settings);
		}
		return true;
	} catch {
		return false;
	}
}

export function removeSelfLearning(): boolean {
	try {
		if (fs.existsSync(SCRIPT_PATH)) fs.rmSync(SCRIPT_PATH, { force: true });

		const settings = readSettings();
		const hooks = settings.hooks as Record<string, unknown[]> | undefined;
		if (hooks?.Stop && Array.isArray(hooks.Stop)) {
			hooks.Stop = (hooks.Stop as unknown[]).filter((h: unknown) => {
				if (typeof h === "object" && h !== null && "hooks" in h) {
					const inner = (h as { hooks: unknown[] }).hooks;
					return !(
						Array.isArray(inner) &&
						inner.some(
							(x: unknown) =>
								typeof x === "object" &&
								x !== null &&
								"command" in x &&
								String((x as { command: string }).command).includes(
									"session-learn",
								),
						)
					);
				}
				return true;
			});
			writeSettings(settings);
		}
		return true;
	} catch {
		return false;
	}
}

/** Count captured learnings so far (for status/summary output). */
export function countLearnings(): number {
	try {
		if (!fs.existsSync(LEARNINGS_FILE)) return 0;
		const text = fs.readFileSync(LEARNINGS_FILE, "utf-8");
		return (text.match(/^- \*\*\d{4}-\d{2}-\d{2}\*\*/gm) ?? []).length;
	} catch {
		return 0;
	}
}
