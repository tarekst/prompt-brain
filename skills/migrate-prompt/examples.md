# Examples: migrate-prompt

One fully worked migration, showing the invocation, the migrated prompt (the skill outputs
this in a fenced code block) and the rendered migration changelog. It calibrates three
things: how far to strip source-specific accommodations, how to phrase **What -> Why** pairs
as source -> target, and how to stay honest about what the guides do *not* say. Quotes from
the guides stay in their original German; everything else is framing text.

---

## Example — `claude-opus-4-8` -> `claude-fable-5` (agent system prompt)

An agent spec that was carried forward onto Opus 4.8 from an older Claude and still drags
along legacy API config, an assistant prefill, and a rigid step list.

**Invocation**

```
/prompt-brain:migrate-prompt opus-4.8 fable # Dependency Upgrade Agent

API config:
  model: claude-opus-4-8
  thinking: { type: "enabled", budget_tokens: 12000 }
  temperature: 0.2
  output_config: { effort: "xhigh" }
  messages[-1] (assistant prefill): "## Step 1 — Inventory\n"

You are an agent that upgrades the pinned dependencies of this monorepo.

Follow these steps exactly, in this order, and do not skip one:
1. Run `pnpm ls --depth 0` in every workspace package and write the result to
   `./upgrade/inventory.md`.
2. For each package, look up the current stable release and note the delta.
3. Group the upgrades into patch, minor and major groups.
4. Apply the groups one at a time, in that order.
5. Run the test suite after each applied group.
6. Write `./upgrade/report.md` when all groups are done.

After every 3 tool calls, print a one-line status so I can follow along; otherwise stay
silent — no narration between tool calls and no closing summary longer than 3 lines.

Decide small things yourself (naming, ordering, equivalent version choices) instead of
asking; only ask before scope changes or destructive actions.

Tools:
- `web_search` — call this when you need a package's current release notes.
- `run_tests` — call this when a version group has been applied.

Constraints:
- Never bump a major version without an explicit note in the report.
- Do not touch lockfiles outside `./packages`.
- If a group fails tests twice, revert that group and continue with the next.

Begin with Step 1.
```

**Resolution** (Step 1, before any file read): `opus-4.8` -> `claude-opus-4-8`,
`fable` -> `claude-fable-5`. Two guides loaded, nothing else.

---

### 1. The Migrated Prompt

```
# Dependency Upgrade Agent

API config:
  model: claude-fable-5
  output_config:
    effort: "xhigh"        # sweep medium/low for routine upgrade runs
    format: json schema for ./upgrade/report.md (replaces the removed prefill)
  fallbacks: ["claude-opus-4-8"]   # beta header: server-side-fallback-2026-06-01
  # no `thinking` key at all — thinking is always on
  # workspace must allow 30-day retention (ZDR is rejected with 400)
  # stream the run; single turns can take minutes at this effort
  # check `stop_reason == "refusal"` before reading `content[0]`

You are an agent that upgrades the pinned dependencies of this monorepo.

## Goal
Bring the pinned dependencies up to their current stable releases, applied in groups
(patch, then minor, then major), with the test suite green after each applied group.

## Deliverables
- `./upgrade/inventory.md` — the current pinned version of every workspace package.
- `./upgrade/report.md` — per group: what was upgraded, the test result, and every
  major-version bump called out explicitly.

## Behavior
- **Anti-overplanning**: when you have enough information to act, act. No plan of a plan,
  and no re-reading of an inventory you already wrote.
- **Boundaries**: do this upgrade and nothing else. Decide small things yourself (naming,
  ordering, equivalent version choices); ask only before scope changes or destructive
  actions.
- **No tidying**: do not refactor, reformat, or otherwise "improve" code you touch while
  upgrading.
- **Grounded progress**: every status claim must be backed by an actual tool result — never
  call a group green before `run_tests` has returned for it.
- **Communication**: one short status line per completed group; closing summary of at most
  3 lines. No narration in between.
- **Long sessions**: this run is long by design. Keep going until every group is applied or
  explicitly reverted; do not stop early because the session feels long.

## Tools
- `web_search` — call this when you need a package's current release notes.
- `run_tests` — call this when a version group has been applied.

## Constraints
- Never bump a major version without an explicit note in the report.
- Do not touch lockfiles outside `./packages`.
- If a group fails tests twice, revert that group and continue with the next.
```

---

### 2. The Migration Changelog

## Migration: claude-opus-4-8 -> claude-fable-5

### Reasoning & sampling config
- **Removed `thinking: {type: "enabled", budget_tokens: 12000}`** -> on Fable 5 thinking is
  always on and the key must be absent entirely: „ein expliziter `{type: "disabled"}` liefert
  400, ebenso `{type: "enabled", budget_tokens: N}`". The source guide already lists this
  form as removed on Opus 4.8, so it was dead config before the migration too.
- **Removed `temperature: 0.2`** -> `temperature`/`top_p`/`top_k` are removed on both models
  (400); depth and determinism are steered through the prompt plus `effort`.
- **Kept `effort: "xhigh"`, added a sweep note** -> both guides expose the same
  `low | medium | high | xhigh | max` scale, and the target guide recommends an effort sweep
  „inkl. `low`/`medium` für Routinearbeit" — routine upgrade runs likely do not need `xhigh`.

### Prefill & output contract
- **Dropped the assistant prefill `"## Step 1 — Inventory"`** -> Fable 5 does not support
  assistant prefill; the guide points to Structured Outputs (`output_config.format`) or a
  system-prompt instruction instead. Same story on Opus 4.8, where prefill returns 400.
- **Replaced the prefill's job with `output_config.format` plus an explicit Deliverables
  section** -> the prefill was steering the shape of the output; that intent now lives in the
  output contract instead of in a forced first token.

### Scaffolding -> goal + behavior sections
- **Collapsed the six numbered steps into Goal + Deliverables + Constraints** -> the target
  guide is explicit: „Migrierte Prompts/Skills entschlacken: über-präskriptives
  Step-by-step-Scaffolding senkt die Qualität — Ziel + Constraints statt Schrittliste". The
  ordering that actually matters (patch -> minor -> major, test after each group) survives as
  a stated goal, not as a procedure.
- **Dropped "After every 3 tool calls, print a one-line status"** -> counting tool calls is a
  source-side cadence rule (the source guide tells you to strip „after every N tool calls"
  scaffolding). The same intent — keep me informed, stay brief — is now carried by the
  Grounded-progress and Communication sections, keyed to completed groups instead of a call
  counter.
- **Turned the silence default and the autonomy hint into named behavior sections** -> both
  existed to counter Opus 4.8's higher narration and its habit of asking about small
  decisions. Fable 5 „profitiert stark von expliziten Kommunikations-/Verhaltens-Sektionen im
  System-Prompt", so the mechanism changed while the instruction stayed identical in effect.
- **Added Anti-overplanning, No-tidying and Grounded-progress sections** -> these are the
  behavior snippets the target guide recommends for Fable 5; they constrain *how* the
  existing task is executed and add no new work.

### Runtime & failure handling (new for the target)
- **Added a `stop_reason == "refusal"` check before reading `content[0]`** -> Fable 5's safety
  classifier returns a refusal with HTTP 200, so reading content first can misfire.
- **Added server-side fallbacks (`claude-opus-4-8`, beta `server-side-fallback-2026-06-01`)**
  -> the target guide says to send them by default.
- **Noted the 30-day retention requirement** -> a ZDR workspace gets a 400 on every Fable 5
  request; this is a deployment precondition the source model never had.
- **Added streaming + long-turn notes** -> single Fable 5 requests can run for minutes at hard
  effort, so timeouts and streaming have to be planned for.
- **Added the "do not stop early" line** -> the guide notes rare early stopping / „Kontext-
  Angst" in very long sessions and suggests countering it with a reminder — relevant here
  because a full monorepo upgrade is exactly such a session.

### Left unchanged, deliberately
- **Kept the `web_search` / `run_tests` "call this when …" trigger descriptions** -> explicit
  tool triggers are an Opus 4.8 accommodation for its conservative tool use, so they were
  candidates for removal. The Fable 5 guide says nothing about tool triggering, and dropping
  them would rest on a model fact neither guide supports — kept as the safer option.
- **Did not add a memory file, a `send_to_user` tool, or async sub-agents** -> the target
  guide lists all three as behavior sections Fable 5 benefits from, but each would introduce
  an artifact or a workflow the original prompt never asked for. Flagged here instead of
  silently expanding the scope.
- **Carried the Constraints block over verbatim** -> pure task intent (major-version policy,
  lockfile boundary, revert rule), not a source-model accommodation.

### Guide gaps
- Neither guide covers tool-trigger phrasing for Fable 5, which is why the tool descriptions
  were left as-is rather than rewritten.
- The target guide marks the cross-model handling of returned thinking blocks as unverified.
  It does not affect this migration — the prompt replays no assistant turns — but it would
  matter for a multi-turn transcript being moved onto Fable 5.

**Guide-Stand**: `claude-opus-4-8` last_verified 2026-06-13 · `claude-fable-5` last_verified
2026-06-13. Both are under six months old, so no staleness warning applies. The **source**
guide is marked `status: legacy` (successor `claude-opus-5`) — worth noting, but it changes
nothing here: the successor hint fires only when the *target* is legacy, and this migration
moves off the legacy model, which is the direction the marker exists to encourage.
