# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
