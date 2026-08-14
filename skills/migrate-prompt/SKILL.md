---
name: migrate-prompt
description: Migrates a prompt that was tuned for one model so it is optimized for another, using per-model guides. Reads only the two selected guides on demand and outputs the migrated prompt plus a migration changelog.
when_to_use: |
  Use when the user wants to take a prompt tuned for model A and re-tune it for model B. Typical triggers: "migrate this prompt from X to Y", "/prompt-brain:migrate-prompt opus-4.8 gpt-5 <prompt>".
user-invocable: true
disable-model-invocation: true
argument-hint: "[current-model] [target-model] [prompt to migrate]"
model: claude-opus-5
---

# Prompt Migration Algorithm

Migrate a prompt from a SOURCE model to a TARGET model using the per-model guides in
`model-guides/`. Read ONLY the two guides you actually need -- never the whole folder.

## Depth Calibration

Current session effort: `${CLAUDE_EFFORT}`.

- `low` / `medium`: condensed pass -- resolve, load the two guides, apply only the
  highest-impact migration changes, keep the changelog to major items. Do NOT read
  `examples.md`.
- `high` / `xhigh` / `max`: run the full algorithm, covering every accommodation category
  in Step 3; consult [examples.md](examples.md) for a worked source -> target migration when
  calibration helps.

## Input

$ARGUMENTS

Parse the arguments into three components:

- `current-model` -- the FIRST whitespace-delimited token.
- `target-model` -- the SECOND whitespace-delimited token.
- `prompt` -- everything after the second token (the prompt to migrate; may span lines).

Parse positionally, consuming from the left of the whitespace-tokenized arguments:

1. Skip a leading `from` if present.
2. Take the next token as `current-model`.
3. Skip an intervening `to`, `->`, `-->` or `→` if present.
4. Take the next token as `target-model`.
5. Everything after that token is the `prompt` -- **verbatim and un-normalized**.

Strip wrapping quotes from the two model tokens only. So `from "opus-4.8" to gpt-5 <prompt>`
and `opus-4.8 -> gpt-5 <prompt>` both yield `opus-4.8` / `gpt-5`. Filler words and arrows
inside the prompt body are prompt content and must survive untouched.

If a model token is missing entirely, ask the user to supply
`<current-model> <target-model> <prompt>` and stop.

---

## Step 1: Resolve both models (no file reads yet)

Match `current-model` and `target-model` against the registry below. Matching is
case-insensitive and ignores surrounding whitespace; a token matches a guide if it equals the
guide's `id` OR any of its `aliases`.

<!-- BEGIN model-registry -- keep in sync with model-guides/*.md frontmatter -->

| id | aliases |
|----|---------|
| claude-opus-5 | opus, opus-5, claude-opus5, opus5 |
| claude-sonnet-5 | sonnet, sonnet-5, claude-sonnet5, sonnet5 |
| claude-fable-5 | fable, fable-5, fable5 |
| claude-haiku-4-5 | haiku, haiku-4.5, claude-haiku-4.5, haiku4.5 |
| claude-opus-4-8 | opus-4.8, claude-opus-4.8, opus4.8 |
| claude-sonnet-4-6 | sonnet-4.6, claude-sonnet-4.6, sonnet4.6 |
| gpt-5.6-sol | gpt-5.6, sol, gpt5.6, 5.6-sol |
| gpt-5.6-terra | terra, gpt5.6-terra, 5.6-terra |
| gpt-5 | gpt5, openai-gpt-5, openai-gpt5 |
| gpt-5-mini | gpt5-mini, gpt-5mini, gpt-5-mini-2025-08-07, gpt5mini |
| o3 | openai-o3, o3-reasoning, o3-2025-04-16, o-3 |
| gpt-4.1 | gpt4.1, gpt-4-1, gpt41, gpt-4.1-2025-04-14 |
| gemini-3.7-flash | gemini-3.7, gemini-3-7-flash, 3.7-flash, gemini-flash-3.7 |
| gemini-3.1-pro-preview | gemini-3.1-pro, gemini-3.1, 3.1-pro, gemini-pro-3.1 |
| gemini-2.5-pro | gemini-2.5-pro-preview-06-05, gemini25pro, gemini-25-pro, gemini2.5pro |
| gemini-2.5-flash | gemini25flash, gemini-25-flash, gemini2.5flash |
| gemma-3 | gemma3, gemma-3-27b, gemma-3-27b-it, gemma-3-12b-it, gemma3-27b, gemma_3 |
| grok-4.6 | grok4.6, grok-4.6-latest, grok46, grok-4-6, grok4-6 |
| grok-4.3 | grok4.3, grok-4.3-latest, grok43, grok-4-3, grok4-3 |
| grok-4 | grok4, grok-4-latest, grok-4-0709, xai.grok-4 |
| mistral-large-3 | mistral-large, mistral-large-latest, mistral-large-2512, large-3, large3, Mistral-Large-3-675B-Instruct-2512 |
| mistral-large-2 | mistral-large-2407, mistral-large-2.0 |
| deepseek-v4-flash | v4-flash, deepseek-flash, deepseek-v4-flash-0731 |
| deepseek-v4-pro | v4-pro, deepseek-pro, deepseek-v4-pro-0813 |
| deepseek-r1 | deepseek-reasoner, r1 |
| deepseek-v3 | deepseek-chat, v3, deepseek-v3-base, deepseek-v3-0324, deepseek-v3-chat |
| muse-glimmer-30b | muse-glimmer, glimmer, muse_glimmer, meta-models/Muse-Glimmer-30B, muse-glimmer-30b-gguf |
| llama-4-maverick | llama4-maverick, llama-4-maverick-17b, llama-4-maverick-17b-128e-instruct, llama4:maverick |
| llama-4-scout | llama4-scout, llama-4-scout-17b-16e, llama-4-scout-17b-16e-instruct, meta-llama-4-scout |

<!-- END model-registry -->

Alias policy: a **bare family alias** (`opus`, `sonnet`, `mistral-large`) always resolves to the
newest guide of that family — move it when a new generation is added. Everything else is
version-pinned and stays on its own guide, including vendor `…-latest` strings that name a
specific generation (`grok-4-latest`, `grok-4.3-latest`).

If EITHER model does not resolve to exactly one guide: list the available `id`s from the
registry, state which argument failed, and STOP. Do NOT invent a guide and do NOT read any
guide file.

If `source-id == target-id`, report that the prompt is already targeted at that model and
stop -- do not read any guide.

If both models resolved but the prompt component is empty, ask the user for the prompt to
migrate (keep the two resolved models) and stop.

---

## Step 2: Load only the two resolved guides (lazy loading)

Read EXACTLY two files: `model-guides/<source-id>.md` and `model-guides/<target-id>.md`.
Never read the whole folder, and never read a third guide.

---

## Step 3: Understand the prompt through the SOURCE guide

Using the source guide, separate the prompt's TASK INTENT from its SOURCE-SPECIFIC
accommodations. Source-specific accommodations are the parts that exist only because of the
source model -- for example:

- thinking / effort / reasoning parameters and how they are expressed,
- forced step-by-step or planning scaffolding the source model needed,
- model-specific prompt formats, control tokens, or role conventions,
- output / verbosity / format hedges tuned to the source model,
- tool-calling or system-prompt patterns the source guide describes.

Record the intent (goal, constraints, output contract) separately from these accommodations.
Do not rewrite yet.

---

## Step 4: Reconstruct for the TARGET model

Rebuild the prompt so it is idiomatic for the target model, using the target guide:

- Remove source-specific accommodations the target handles differently or natively.
- Apply target-specific conventions (reasoning/effort handling, prompting style, prompt
  format, output conventions) from the target guide.
- Preserve the original intent exactly -- never add or drop goals or constraints.
- Use ONLY facts from the two loaded guides and the prompt itself. If a guide marks something
  with "(unbelegt)" / unverified, or a needed section is missing, do not assert it -- choose
  the safer change and flag the uncertainty in the changelog.

---

## Step 5: Output

Present exactly this structure:

### 1. The Migrated Prompt

The reconstructed prompt inside a fenced code block (triple backticks) so the user can copy
it directly.

### 2. The Migration Changelog

Rendered markdown (NOT in a code block). Group changes by theme; every entry is a
**What -> Why** pair framed as source -> target (e.g. "Removed `budget_tokens` -> the target
uses adaptive thinking"). End with any guide gaps or "(unbelegt)" points that limited the
migration. If source and target are very similar and few changes apply, say so honestly
instead of forcing changes.

Close the changelog with a `Guide-Stand` footer listing each guide's `last_verified` date.
If either date is older than 6 months, warn that the guide's model facts may be outdated.
If the TARGET guide's frontmatter says `status: legacy` and names a `successor`, note it and
suggest migrating to the successor instead -- carrying over any caveat the target guide itself
states about that successor. Never read the successor's guide: two guides per run, always.

---

## Constraints

- **Lazy loading**: read only the two resolved guides -- never the whole `model-guides/`
  folder, never a third guide.
- **Preserve language**: if the input prompt is in German, the migrated prompt stays German.
  Match the original language.
- **Preserve intent**: never add goals, constraints, or phases not in the original prompt.
- **No invented model facts**: rely only on the two loaded guides and the prompt. Do not pull
  model behaviour from memory.
- **Missing / ambiguous model**: list the available models and stop; do not guess a guide.
- **No meta-commentary**: do not explain these algorithm steps in the output -- just the
  migrated prompt and the changelog.
