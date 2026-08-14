# Evaluations: migrate-prompt

Test scenarios for the `migrate-prompt` skill, following Anthropic's "build evaluations
first" guidance, adapted for a text-transform skill (the only file reads are the two
resolved model guides; no scripts). These are NOT loaded by the skill — they live in `evals/` for out-of-band testing.

How to run: invoke `/prompt-brain:migrate-prompt <current-model> <target-model> <prompt>`
for each scenario and confirm every `expected_behavior` bullet holds. The skill passes a
scenario only if all bullets are satisfied.

Several scenarios assert *which files were read*. Verify those against the session's tool
calls: count every `Read` against `skills/migrate-prompt/model-guides/` — the expected
count is 0 or exactly 2, never 1, never 3, never the whole folder.

---

## Scenario 1 — Unknown model token

- **input:** `gpt-6-turbo opus-4.8 Write release notes for our v2 API from the changelog in CHANGELOG.md`
- **expected_behavior:**
  - Resolution fails on `gpt-6-turbo` and the skill STOPS — no migrated prompt, no changelog.
  - Names which argument failed (the `current-model`), not just "a model".
  - Lists the available `id`s from the registry table in `SKILL.md`.
  - Reads ZERO guide files (no `Read` on `model-guides/` at all) — including the guide for
    the model that *did* resolve.
  - Does NOT substitute a near-match (`gpt-5`, `gpt-5-mini`) and does NOT invent a guide.

## Scenario 2 — Source equals target (two aliases of one model)

- **input:** `opus-4.8 claude-opus-4.8 Refactor src/api/client.ts to use the new fetch wrapper. Keep the public signature stable.`
- **expected_behavior:**
  - Recognizes both tokens resolve to the same `id` (`claude-opus-4-8`) despite different aliases.
  - Reports that the prompt is already targeted at that model and stops.
  - Reads ZERO guide files.
  - Does NOT emit a migrated prompt or a changelog, and does NOT invent cosmetic changes to
    justify a migration.

## Scenario 3 — Happy path (deepseek-r1 -> opus-4.8)

- **input:**
  ```
  deepseek-r1 opus-4.8 <think>
  Plan the steps first, then answer.
  </think>
  Denke Schritt für Schritt. You are an expert Go reviewer. Review the diff in review.patch and list every correctness bug. Think step by step before answering and show your reasoning, then give the final list.
  ```
- **expected_behavior:**
  - Reads EXACTLY two files: `model-guides/deepseek-r1.md` and `model-guides/claude-opus-4-8.md`.
  - Reads no third guide and does not enumerate/glob the `model-guides/` folder.
  - Outputs the migrated prompt inside a fenced code block (copy-pasteable).
  - Outputs the changelog as rendered markdown (headings/bold/bullets), NOT in a code block.
  - Every changelog entry is a **What -> Why** pair framed as source -> target.
  - Drops the source-specific reasoning scaffolding (`<think>` block, forced "think step by
    step" / "show your reasoning") because the target handles reasoning differently.
  - Preserves the task intent exactly: Go review, `review.patch`, correctness bugs, final list.
  - Closes with a `Guide-Stand` footer listing both guides' `last_verified` dates.
  - No meta-commentary about the 5 algorithm steps.

## Scenario 4 — "(unbelegt)" points must be flagged, never asserted

- **input:** `opus-4.8 gemma-3 Extract every invoice line item from invoices/*.pdf and return strict JSON matching {"items":[{"sku":string,"qty":number,"total":number}]}. Reason about ambiguous rows before deciding.`
- **expected_behavior:**
  - Reads exactly `model-guides/claude-opus-4-8.md` and `model-guides/gemma-3.md`.
  - Does NOT assert a structured-output/JSON-schema feature for the target — the target guide
    marks that as "(unbelegt)".
  - Instead applies the safer change (explicit format instructions in the prompt text) and
    keeps the JSON contract as prompt-level instruction.
  - The changelog explicitly flags the "(unbelegt)" / unverified points as a limitation of the
    migration (e.g. in a closing "guide gaps" note), rather than presenting them as fact.
  - Uncertainty appears in the changelog only — the migrated prompt itself stays clean of
    hedging meta-notes.

## Scenario 5 — Case-insensitive alias resolution

- **input:** `DeepSeek-R1 OPUS-4.8 Summarize the incident timeline in postmortems/2026-05-outage.md into five bullets for the exec update.`
- **expected_behavior:**
  - Resolves `DeepSeek-R1` (id, uppercased) and `OPUS-4.8` (alias, uppercased) without error.
  - Reads exactly `model-guides/deepseek-r1.md` and `model-guides/claude-opus-4-8.md`.
  - Does NOT ask the user to re-enter the models and does NOT list the registry as a fallback.
  - Produces a normal migration (fenced migrated prompt + rendered changelog).

## Scenario 6 — German input prompt stays German

- **input:** `sonnet-4.6 gpt-5 Analysiere unsere Codebasis unter src/ und erstelle eine Architekturübersicht. Denke gründlich nach, bevor du antwortest, und begründe jede Schlussfolgerung ausführlich.`
- **expected_behavior:**
  - The migrated prompt is written in German (matches the input language).
  - The changelog is also in German.
  - German characters (ä, ö, ü, ß) render correctly — UTF-8 preserved, no mojibake in either
    the code block or the changelog.
  - Reads exactly `model-guides/claude-sonnet-4-6.md` and `model-guides/gpt-5.md`.
  - Re-tunes the reasoning/verbosity phrasing for the target instead of translating it
    literally, while keeping the goal (`src/` analysis, Architekturübersicht) unchanged.

## Scenario 7 — Prompt body mentions model names (parsing robustness)

- **input:** `gpt-5 claude-opus-4.8 Schreibe einen Vergleichsbericht zu gemini-2.5-pro, grok-4 und mistral-large-2: Latenz, Kosten und Tool-Calling. Beschreibe außerdem den Migrationspfad from gpt-4.1 -> o3 und erwähne o3 nur, wenn Zahlen vorliegen.`
- **expected_behavior:**
  - Parses `gpt-5` as `current-model` and `claude-opus-4.8` as `target-model` only — the model
    names inside the prompt body do not shift or re-anchor the two leading tokens.
  - Reads exactly `model-guides/gpt-5.md` and `model-guides/claude-opus-4-8.md`; reads none of
    `gemini-2.5-pro.md`, `grok-4.md`, `mistral-large-2.md`, `o3.md`.
  - Treats the in-body model names as literal prompt content: they survive verbatim in the
    migrated prompt (still `gemini-2.5-pro`, `grok-4`, `mistral-large-2`, `gpt-4.1`, `o3`).
  - Does NOT report an ambiguous/extra model or ask which models were meant.
  - Applies the `from` / `->` normalization only around the two leading model tokens: the
    `from gpt-4.1 -> o3` phrase inside the body is left untouched.

## Scenario 8 — Migrating TO a legacy model (freshness + successor hint)

- **input:** `sonnet-4.6 opus-4.8 Refactor the ingest pipeline in src/ingest/ into a queue-backed worker, then update the README.`
- **expected_behavior:**
  - Both tokens resolve to version-pinned guides — `opus-4.8` must NOT be re-routed to
    `claude-opus-5` (only the bare `opus` alias points at the newest generation).
  - Reads exactly `model-guides/claude-sonnet-4-6.md` and `model-guides/claude-opus-4-8.md`.
  - The changelog closes with a `Guide-Stand` footer naming both guides' `last_verified` dates.
  - Because the TARGET guide carries `status: legacy` with `successor: claude-opus-5`, the
    changelog notes this and suggests migrating to the successor instead — without refusing
    or silently retargeting the requested migration.
  - Still produces the full migrated prompt for the requested target (the successor note is
    an addition, not a substitution).

## Scenario 9 — Effort-adaptive depth

- **input:** run any happy-path scenario twice, once after `/effort low` and once after `/effort max`.
- **expected_behavior:**
  - Both runs produce a migrated prompt in a fenced code block plus a rendered changelog, and
    both read exactly two guides — the contract does not change with effort.
  - The `low` run is visibly condensed: only the highest-impact migration changes, changelog
    limited to major items, and `examples.md` is NOT read (SKILL.md's depth-calibration block
    states this explicitly for `low`/`medium`).
  - The `max` run covers every accommodation category from Step 3.
