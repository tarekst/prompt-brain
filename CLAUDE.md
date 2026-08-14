# prompt-brain

## Architecture

A Claude Code plugin with two skills. Claude Code is the runtime -- no external code, scripts, or services.

- **optimize-prompt** optimizes a user prompt using a 5-step algorithm:
  Parse & Intent Extraction -> Weakness Analysis -> Best-Practice Matching -> Prompt Reconstruction -> Changelog Generation, encoded entirely in `skills/optimize-prompt/SKILL.md`.
- **migrate-prompt** re-tunes a prompt from a source model to a target model using per-model guides in `skills/migrate-prompt/model-guides/`. It reads ONLY the two selected guides at runtime (lazy loading) and outputs the migrated prompt plus a migration changelog.

## Components

- **skills/optimize-prompt/SKILL.md** -- core optimize skill with the 5-step algorithm (<=500 lines, ~1500-2000 words).
- **skills/optimize-prompt/examples.md** -- worked input -> optimized-output -> changelog examples (loaded on demand), plus a weakness quick-reference.
- **skills/migrate-prompt/SKILL.md** -- migration skill: argument parsing, the in-file model registry (id + aliases), the lazy-loading runtime contract, and the migrate algorithm.
- **skills/migrate-prompt/model-guides/*.md** -- one guide per supported model (schema: frontmatter `model`/`vendor`/`family`/`aliases`/`last_verified`, then Reasoning/Thinking, Prompting-Stil, Stärken & Schwächen, Output- & Format-Konventionen, Migrations-Hinweise, Quellen). Guide bodies are in German; sourced from official vendor docs with cited URLs and "(unbelegt)" markers for unverifiable claims.
- **.claude-plugin/plugin.json** -- plugin manifest.
- **.claude-plugin/marketplace.json** -- single-plugin marketplace catalog for distribution via `/plugin marketplace add`.
- **evals/optimize-prompt.md** -- test scenarios with expected-behavior rubrics (out-of-band; never loaded by the skill).

## Usage

```
/prompt-brain:optimize-prompt [your prompt to optimize]
/prompt-brain:migrate-prompt [current-model] [target-model] [prompt to migrate]
```

## Skill Frontmatter Policy

- `user-invocable: true` + `disable-model-invocation: true` -- this skill runs only when the user types `/prompt-brain:optimize-prompt`. Claude never auto-invokes it. Because `disable-model-invocation` is set, the skill's `description` is not loaded into context during normal sessions -- it only surfaces in the `/` menu, so optimize it for human readers, not auto-discovery keywords.
- `model: claude-opus-5` is pinned deliberately. The 5-step algorithm needs deep reasoning; do not downgrade without re-evaluating output quality. Keep this current with the latest Opus on each release.
- `when_to_use` is human documentation only: with `disable-model-invocation` set, neither `description` nor `when_to_use` ever reaches Claude's context, so keep the field free of Claude-directed instructions.
- No `effort` field -- deliberately omitted so the skill inherits the session's current effort level. Omission is the only inherit mechanism (there is no `effort: inherit` value). Do not re-add a pinned effort value without re-evaluating; users who want full depth can run `/effort max` before invoking.
- No `allowed-tools` / `disallowed-tools`. `allowed-tools` only *pre-approves* tools (it never restricts them), so an empty list is a no-op -- it is intentionally omitted. Both skills need only the default Read access (optimize-prompt loads `examples.md`; migrate-prompt loads the two selected `model-guides/*.md`). Do not re-add `allowed-tools: []`; it documents nothing.
- **migrate-prompt** mirrors this exact frontmatter policy (same `model` pin, no `effort`, no `allowed-tools`, `disable-model-invocation: true`) and adds `argument-hint: [current-model] [target-model] [prompt to migrate]`. Keep both skills' frontmatter in sync on each release.

## Progressive Disclosure

- `optimize-prompt/SKILL.md` holds the **entire** 5-step algorithm inline. This is deliberate: every invocation needs all 5 steps, so splitting them into a `reference.md` would force an always-load and risk Claude under-reading it. Progressive disclosure is for material needed on only *some* runs.
- Keep each `SKILL.md` under 500 lines and under ~2000 words (optimize-prompt ~1400, migrate-prompt ~900). Both are within budget.
- `optimize-prompt/examples.md` is the load-on-demand layer (calibration examples Claude reads when useful). `evals/` is out-of-band and never loaded by the skill.
- `migrate-prompt/model-guides/*.md` is the load-on-demand layer for migration: each invocation reads exactly the two guides that the two model arguments resolve to -- never the whole folder. The registry table in `migrate-prompt/SKILL.md` enables alias resolution WITHOUT reading any guide, which is what keeps lazy loading honest. **When adding/removing a guide, update that registry table to match the new `model-guides/*.md` frontmatter** (id + aliases) -- the registry is the resolver's source of truth and the fallback "available models" list.

## migrate-prompt Notes

- Guide bodies are intentionally in German (matches the maintainer); the SKILL.md algorithm is English like `optimize-prompt`. The skill operates language-agnostically on whatever the guide says, and preserves the input prompt's language in its output. If an English-facing guide set is preferred later, translate the guide bodies -- the schema and registry stay the same.
- Guides must stay grounded in official vendor sources (cited URLs); never let a guide assert un-sourced model behaviour. Unverifiable points are marked "(unbelegt)" and the skill is told not to assert them.

## Development Notes

- `.research/` is gitignored. It contains maintainer-local reference material (e.g. `PLUGIN_CREATION.md` snapshots). Do not commit research artifacts.
- Local testing: `claude --plugin-dir .` (from the repo root).
- Validation (from the repo root): `claude plugin validate .` (validates `marketplace.json`) and `claude plugin validate .claude-plugin/plugin.json` (validates the plugin manifest + contents). Note: `--strict` on the plugin target fails on a warning about the root `CLAUDE.md` — that file is maintainer project memory, intentionally not plugin-shipped context, so run the plugin target without `--strict` (CI does the same).
- In-session reload: `/reload-plugins`.

## Distribution

- Marketplace install: `/plugin marketplace add tarekst/prompt-brain` then `/plugin install prompt-brain@tarek-plugins`.
- The marketplace entry uses a GitHub source pointing at this same repo, so a new release reaches users when `version` in `plugin.json` is bumped. Do not also set `version` in the marketplace entry -- `plugin.json` wins and a stale duplicate would mask it.

## Conventions

- Indentation: 2 spaces
- Naming: English, kebab-case for files and directories
- Encoding: UTF-8
- Paths: Relative in all plugin config. No scripts exist today; if any are added later, reference them via `${CLAUDE_PLUGIN_ROOT}`.
