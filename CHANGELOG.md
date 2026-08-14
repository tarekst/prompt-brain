# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-08-14

Current-generation model coverage, a machine-checked registry, and effort-adaptive skills.

### Added

- **12 new model guides** — Claude Opus 5 and Sonnet 5, OpenAI GPT-5.6 Sol/Terra, Gemini 3.7 Flash and 3.1 Pro, Grok 4.6 and 4.3, DeepSeek V4-Flash and V4-Pro, Mistral Large 3, and Meta Muse Glimmer 30B (29 guides total). Every model id was verified against official vendor documentation before a guide was written; unverifiable candidates were skipped rather than guessed.
- **Guide freshness metadata** — required `status: current|legacy` in the guide frontmatter, plus `successor: <id>` wherever the vendor documents one (`gpt-4.1` and `gemini-2.5-pro` are marked legacy without a successor, because no official replacement is documented). `migrate-prompt` now closes its changelog with a `Guide-Stand` footer listing both guides' `last_verified` dates, warns when a guide is older than six months, and suggests the successor when migrating *to* a legacy model.
- **`scripts/check-registry-sync.mjs`** — dependency-free Node check that the in-`SKILL.md` registry table and the guide frontmatter are an exact mirror. Also catches aliases that can never resolve (whitespace, id-duplicates, cross-model collisions) and guides missing `last_verified` or a `## Quellen` section.
- **`.github/workflows/validate.yml`** — CI running the sync check plus `claude plugin validate` on both targets.
- **`skills/migrate-prompt/examples.md`** — one fully worked migration (Opus 4.8 → Fable 5) as the load-on-demand calibration layer, mirroring `optimize-prompt/examples.md`.
- **`evals/migrate-prompt.md`** — 9 scenarios covering the runtime contract: unknown model stops without reading a guide, source == target short-circuits, exactly two guide reads on the happy path, "(unbelegt)" flagging, case-insensitive aliases, language preservation, parsing robustness against model names inside the prompt body, migrating *to* a legacy model (freshness footer + successor hint), and effort-adaptive depth.
- **Effort-adaptive depth** — both skills carry a `${CLAUDE_EFFORT}` calibration block: `low`/`medium` run a condensed pass, `high`+ the full algorithm. Makes the v0.4.0 "inherit the session effort" design deterministic instead of implicit.
- **`displayName`** in `plugin.json` (human-readable name in the `/plugin` picker) and **`$schema`** in both manifests for editor validation.

### Changed

- **Bare family aliases now resolve to the newest generation** — `opus` → `claude-opus-5`, `sonnet` → `claude-sonnet-5`, `mistral-large`/`mistral-large-latest` → `mistral-large-3`. Version-pinned aliases (`opus-4.8`, `mistral-large-2407`) stay on their own guide. The rule is documented in `SKILL.md` and `CLAUDE.md`.
- **`migrate-prompt` argument parsing hardened** — tolerates `from X to Y`, `X -> Y`, and quoted model tokens; an empty prompt component now asks for the prompt instead of restating the usage line.
- **12 superseded guides marked `status: legacy`**, each with its documented successor where the vendor names one.
- **A Gemini 3.6 Flash guide was drafted and dropped** before release in favour of Gemini 3.7 Flash, which Google's model list marks "New Stable". Nothing was removed from a shipped release.

## [0.5.0] - 2026-08-14

Adds a second skill: cross-model prompt migration.

### Added

- **`migrate-prompt` command** (`/prompt-brain:migrate-prompt <current-model> <target-model> <prompt>`) — understands a prompt through its source model's guide and re-tunes it for a target model, outputting the migrated prompt plus a model-A → model-B changelog.
- **`skills/migrate-prompt/model-guides/` (17 guides)** — per-model prompting guides for Claude (Opus 4.8, Sonnet 4.6, Haiku 4.5, Fable 5), OpenAI (GPT-5, GPT-5 mini, o3, GPT-4.1), Google (Gemini 2.5 Pro/Flash, Gemma 3), Meta (Llama 4 Maverick/Scout), xAI (Grok 4), Mistral (Large 2), and DeepSeek (R1, V3). Each follows a fixed schema and cites official vendor sources; unverifiable claims are marked "(unbelegt)".
- **Lazy-loading runtime contract** — the command resolves both model arguments against an in-`SKILL.md` registry (canonical id + aliases) and reads **only** the two matching guides, never the whole folder. Unknown models list the available set and stop instead of guessing.

### Changed

- **Model pin `claude-opus-4-8` → `claude-opus-5`** in both skills' frontmatter (latest Opus, per the frontmatter policy).
- **`plugin.json` / `marketplace.json`** — description and keywords updated for the migrate capability.
- **README & CLAUDE.md** — document the second skill, the model-guide schema, and the registry-sync requirement.

## [0.4.0] - 2026-06-13

### Changed

- **Skill effort now follows the session** — removed the `effort: max` pin from the skill frontmatter. With the field omitted, the skill inherits the session's current effort level (omission is the documented inherit mechanism; there is no `effort: inherit` value). Run `/effort max` before invoking if full reasoning depth is wanted.
- **README and CLAUDE.md** updated to document the session-effort behavior instead of the former maximum-effort policy.

## [0.3.0] - 2026-06-03

State-of-the-art alignment with the latest Claude Code skill and plugin conventions.

### Added

- **`.claude-plugin/marketplace.json`** — single-plugin marketplace catalog (GitHub source), enabling `/plugin marketplace add tarekst/prompt-brain` + `/plugin install prompt-brain@tarek-plugins` with versioned updates.
- **`evals/optimize-prompt.md`** — evaluation rubric with 5 test scenarios and expected-behavior bullets (Anthropic "build evaluations first"). Out-of-band; never loaded by the skill.
- **Full worked examples in `examples.md`** — three input → optimized-output → changelog pairs (Anthropic "examples pattern"), now referenced from `SKILL.md`.

### Changed

- **Model pin `claude-opus-4-7` → `claude-opus-4-8`** in skill frontmatter (latest Opus).
- **`examples.md` rewritten** from a weakness-only list into worked I/O pairs plus a condensed weakness quick-reference table.
- **`SKILL.md` voice tightened** to imperative/infinitive ("Execute the 5-step algorithm…", "Present the result…") per skill-authoring best practices.
- **README** — marketplace install flow added; model and supporting files documented.
- **CLAUDE.md** — corrected `allowed-tools` semantics, documented the inline-algorithm rationale for progressive disclosure, added marketplace/evals components and a Distribution section.

### Fixed

- **Documentation of `allowed-tools`** — it only *pre-approves* tools and never restricts them, so the empty-array "pure text transform contract" claim was incorrect.

### Removed

- **No-op `allowed-tools: []`** from skill frontmatter (an empty allow-list does nothing).

## [0.2.0] - 2026-04-18

### Added

- **Explicit `model: claude-opus-4-7` pin** in skill frontmatter — ensures deep reasoning for the 5-step optimization algorithm.
- **Explicit `allowed-tools: []` declaration** — documents that the skill is a pure text transform; no permission prompts will be raised.
- **`when_to_use` frontmatter field** with trigger hints for documentation and future policy changes.
- **`skills/optimize-prompt/examples.md`** with 10 worked examples (relocated from root `examples.txt`, reformatted as Markdown with weakness annotations).
- **Tracked `CLAUDE.md`** with architecture docs, frontmatter policy, progressive disclosure rules, and development notes.

### Changed

- **README usage examples** now use the canonical namespaced invocation `/prompt-brain:optimize-prompt` instead of the bare form.

### Removed

- Root-level `examples.txt` (content relocated to `skills/optimize-prompt/examples.md`).
- `CLAUDE.md` from `.gitignore` (now tracked).

## [0.1.0] - 2026-04-06

Initial release of prompt-brain.

### Added

- **Slash command** `/optimize-prompt [prompt]` to optimize any prompt for Claude Code
- **5-step optimization algorithm**:
  - Parse & Intent Extraction — decomposes prompts into goal, phases, scope, agent pattern, expected outputs, and implicit assumptions
  - Weakness Analysis — checks prompts against 7 categories
  - Best-Practice Matching — classifies prompt type and selects applicable patterns
  - Prompt Reconstruction — rebuilds from scratch with top-down structure and measurable criteria
  - Changelog Generation — explains every change as a what->why pair
- **7 weakness categories** for prompt analysis:
  - Missing Context Basis
  - Vague Output Specification
  - Missing Sequencing
  - No Guardrails / Constraints
  - No Success Criteria
  - Inefficient Structure
  - Subagent Instruction Issues
- **Prompt type classification** with tailored best practices for:
  - Multi-step workflows
  - Research / exploration tasks
  - Code generation / refactoring
  - Analysis / review
  - Simple single tasks
- **Language preservation** — output matches the language of the input prompt
- **Copyable output** — optimized prompt rendered in a fenced code block
- **Structured changelog output** — improvements grouped by theme with what->why explanations
- **Maximum effort mode** (`effort: max`) for full model capability
- **User-invocable only** (`disable-model-invocation: true`) — the skill is never triggered automatically
