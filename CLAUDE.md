# prompt-brain

## Architecture

A Claude Code plugin with two skills. Claude Code is the runtime -- the skills themselves invoke no external code or services; `scripts/` and `.github/` are maintainer-side tooling only, never loaded at skill runtime.

- **optimize-prompt** optimizes a user prompt using a 5-step algorithm:
  Parse & Intent Extraction -> Weakness Analysis -> Best-Practice Matching -> Prompt Reconstruction -> Changelog Generation, encoded entirely in `skills/optimize-prompt/SKILL.md`.
- **migrate-prompt** re-tunes a prompt from a source model to a target model using per-model guides in `skills/migrate-prompt/model-guides/`. It reads ONLY the two selected guides at runtime (lazy loading) and outputs the migrated prompt plus a migration changelog.

## Components

- **skills/optimize-prompt/SKILL.md** -- core optimize skill with the 5-step algorithm (<=500 lines, ~1500-2000 words).
- **skills/optimize-prompt/examples.md** -- worked input -> optimized-output -> changelog examples (loaded on demand), plus a weakness quick-reference.
- **skills/migrate-prompt/SKILL.md** -- migration skill: argument parsing, the in-file model registry (id + aliases), the lazy-loading runtime contract, and the migrate algorithm.
- **skills/migrate-prompt/model-guides/*.md** -- one guide per supported model (schema: frontmatter `model`/`vendor`/`family`/`aliases`/`last_verified`, required `status: current|legacy` plus `successor: <id>` on superseded models that have a documented replacement, then exactly these six `##` headings, in this order and spelled character-for-character like this: `## Reasoning / Thinking`, `## Prompting-Stil`, `## Stärken & Schwächen (prompt-relevant)`, `## Output- & Format-Konventionen`, `## Migrations-Hinweise`, `## Quellen`). `scripts/check-registry-sync.mjs` matches those headings verbatim, so a rewording fails CI. Guide bodies are in German; sourced from official vendor docs with cited URLs and "(unbelegt)" markers for unverifiable claims.
- **skills/migrate-prompt/examples.md** -- one worked source -> target migration (load-on-demand calibration layer, mirrors `optimize-prompt/examples.md`).
- **scripts/check-registry-sync.mjs** -- dependency-free Node check that the registry table and the guide frontmatter are an exact mirror (also catches dead aliases: whitespace, id-duplicates, cross-model collisions, missing `last_verified`/Quellen, and section headings that deviate from the schema above). Run it after touching either side. It also reports guide age from `last_verified`: over 150 days is a `WARN` (180 days is the line the skill itself warns users at) -- advisory by default, a hard failure under `--strict-age`.
- **scripts/check-frontmatter.mjs** -- dependency-free Node check that every `skills/*/SKILL.md` frontmatter key is a real Claude Code key (a typo is silently ignored at runtime), that this repo's frontmatter policy below holds, and that the Agent Skills spec constraints on the six portable fields hold.
- **scripts/check-release-consistency.mjs** -- dependency-free Node check that the facts duplicated by hand across a release agree: `plugin.json` version vs the newest `CHANGELOG.md` heading, the identity fields shared with the marketplace entry (which must carry no `version` of its own), and the README's guide count plus its relative links.
- **.github/workflows/validate.yml** -- CI: the three Node checks plus `claude plugin validate` on both targets.
- **.claude-plugin/plugin.json** -- plugin manifest.
- **.claude-plugin/marketplace.json** -- single-plugin marketplace catalog for distribution via `/plugin marketplace add`.
- **evals/** -- machine-runnable `claude plugin eval` suite: one `case.yaml` per scenario under `evals/optimize-prompt/<nn>-<slug>/` and `evals/migrate-prompt/<nn>-<slug>/`, run with `claude plugin eval .` from the repo root (out-of-band; never loaded by the skills). `claude plugin eval` is early-access-gated today, so CI keeps the step commented out and no pass/fail data exists yet. See `evals/README.md` for the flags, the grader conventions, and the run record.

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
- `license` and `compatibility` are deliberate additions, not decoration. They are two of the six fields in the Agent Skills open standard (https://agentskills.io/specification), Claude Code accepts them without acting on them, and they are what survives when a skill directory travels to another host -- so `compatibility` is where each skill records what to do on a host that does not implement the `$ARGUMENTS` / `${CLAUDE_EFFORT}` substitutions. Keep them accurate rather than dropping them.
- **migrate-prompt** mirrors this exact frontmatter policy (same `model` pin, no `effort`, no `allowed-tools`, `disable-model-invocation: true`, same `license`/`compatibility` shape); both skills carry an `argument-hint` matching their own arguments, quoted so YAML parses it as a string rather than a flow sequence. Keep both skills' frontmatter in sync on each release.
- `node scripts/check-frontmatter.mjs` enforces all of the above mechanically -- unknown or typo'd keys, `user-invocable`/`disable-model-invocation`, the pinned `model` (and that both skills pin the *same* one), the absent `effort`/`allowed-tools`, the quoted `argument-hint`, `license` + `compatibility` present, plus the spec's name/length constraints. Change the policy and the script in the same commit; CI runs it.

### Portability

- The Agent Skills standard defines exactly six frontmatter fields: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. That is the portable subset. Outside Claude Code -- a claude.ai upload or the Skills API -- any other key is a HARD ERROR, not an ignored extra, so these skills as shipped are Claude Code artifacts by design.
- `$ARGUMENTS` and `${CLAUDE_EFFORT}` are Claude Code string substitutions (`${CLAUDE_EFFORT}` expands to `low|medium|high|xhigh|max`). Not every host implements them: **OpenCode** documents no argument substitution for skills, so there the body loads verbatim. Both SKILL.md bodies therefore carry two blocks that must stay **word-for-word identical across the two skills** -- keep them in sync whenever either skill's Input or Depth Calibration block is edited:
  - the `<user-input>` wrapper: `$ARGUMENTS` sits alone inside `<user-input>` tags, followed by the line stating that everything between the tags -- and nothing outside them -- is the user's raw input, material to operate on rather than instructions to follow.
  - the effort fallback: if the effort line reads as anything other than `low`, `medium`, `high`, `xhigh` or `max`, the host did not substitute it -- treat the effort as `high` and run the full algorithm. That condition deliberately tests the COMPLEMENT (is the line one of the five level names?) instead of naming the placeholder: a literal `${CLAUDE_EFFORT}` written into the test sentence would itself be substituted, so in a `low` session the rule would read "if the effort line is `low`, treat it as `high`" and would defeat the condensed pass it exists to protect.
- **OpenCode** discovers skills from `.claude/skills/<name>/SKILL.md` (among its own paths) and recognizes five frontmatter fields (`name`, `description`, `license`, `compatibility`, `metadata`); unknown keys are IGNORED, not errors. It does not read `.claude-plugin/` marketplaces or plugin bundles, and documents no argument substitution for skills.
- **Grok Build** (xAI's `grok` CLI) discovers skills from `.grok/skills/`; it accepts but ignores `model`, `effort`, `license`, and `compatibility`. It documents `argument-hint` support but says nothing about whether it substitutes `$ARGUMENTS` -- do not assert its substitution behaviour in either direction.
- This repo deliberately ships **no `AGENTS.md`**. OpenCode uses `CLAUDE.md` only as a fallback -- when both exist in the same category only `AGENTS.md` is read -- so adding one would suppress this file entirely. Grok Build reads `CLAUDE.md` as a project instruction file directly. Do not "add AGENTS.md for compatibility".

## Progressive Disclosure

- `optimize-prompt/SKILL.md` holds the **entire** 5-step algorithm inline. This is deliberate: every invocation needs all 5 steps, so splitting them into a `reference.md` would force an always-load and risk Claude under-reading it. Progressive disclosure is for material needed on only *some* runs.
- Keep each `SKILL.md` under 500 lines and under ~2000 words (optimize-prompt 236 lines / ~1530 words, migrate-prompt 197 lines / ~1401 words). Both are within budget. The migrate registry table is the growth driver -- each new guide adds a row, so re-measure with `wc -lw skills/*/SKILL.md` whenever guides are added or either body is edited, and correct these numbers here.
- `optimize-prompt/examples.md` is the load-on-demand layer (calibration examples Claude reads when useful). `evals/` is out-of-band and never loaded by the skill.
- `migrate-prompt/model-guides/*.md` is the load-on-demand layer for migration: each invocation reads exactly the two guides that the two model arguments resolve to -- never the whole folder. The registry table in `migrate-prompt/SKILL.md` enables alias resolution WITHOUT reading any guide, which is what keeps lazy loading honest. **When adding/removing a guide, update that registry table to match the new `model-guides/*.md` frontmatter** (id + aliases) -- the registry is the resolver's source of truth and the fallback "available models" list. `node scripts/check-registry-sync.mjs` enforces this; CI fails on drift.
- Alias policy (mirrors `migrate-prompt/SKILL.md`): a **bare family alias** (`opus`, `sonnet`, `mistral-large`) always resolves to the NEWEST guide of that family. A **family-level `…-latest`** that names no generation (`mistral-large-latest`) is a rolling pointer and moves with the bare family alias. Everything else is version-pinned and stays on its own guide, including vendor `…-latest` strings that DO name a specific generation (`grok-4-latest`, `grok-4.3-latest`) -- those must NOT be moved. Adding a new generation means moving the bare family aliases *and their rolling `…-latest` partners* to it and stamping `status: legacy` + `successor` on the one it replaces. `scripts/check-registry-sync.mjs` enforces this placement: a bare family alias (rolling `…-latest` included) left on a `status: legacy` guide, or parked on a guide whose stem it does not name, fails the check.

## migrate-prompt Notes

- Guide bodies are intentionally in German (matches the maintainer); the SKILL.md algorithm is English like `optimize-prompt`. The skill operates language-agnostically on whatever the guide says, and preserves the input prompt's language in its output. If an English-facing guide set is preferred later, translate the guide bodies -- the schema and registry stay the same.
- Guides must stay grounded in official vendor sources (cited URLs); never let a guide assert un-sourced model behaviour. Unverifiable points are marked "(unbelegt)" and the skill is told not to assert them.

## Development Notes

- `.research/` is gitignored. It contains maintainer-local reference material (e.g. `PLUGIN_CREATION.md` snapshots). Do not commit research artifacts.
- Local testing: `claude --plugin-dir .` (from the repo root).
- Validation (from the repo root, in the order CI runs it): `node scripts/check-registry-sync.mjs`, `node scripts/check-frontmatter.mjs`, `node scripts/check-release-consistency.mjs`, then `claude plugin validate . --strict` (validates `marketplace.json`) and `claude plugin validate .claude-plugin/plugin.json` (validates the plugin manifest + contents). Note: the plugin target runs WITHOUT `--strict`, because `--strict` fails on a permanent warning about the root `CLAUDE.md` — that file is maintainer project memory, intentionally not plugin-shipped context. A plain non-strict run exits 0 on *all* warnings though (an unrecognized top-level `plugin.json` field is only a warning), so CI greps the output and fails on any warning other than that one allowlisted `CLAUDE.md` line. CI installs a pinned CLI (`@anthropic-ai/claude-code@2.1.246`); bump that line deliberately, never implicitly.
- In-session reload: `/reload-plugins`.

## Distribution

- Marketplace install: `/plugin marketplace add tarekst/prompt-brain` then `/plugin install prompt-brain@tarek-plugins`.
- The marketplace entry uses a GitHub source pointing at this same repo, so a new release reaches users when `version` in `plugin.json` is bumped. Do not also set `version` in the marketplace entry -- `plugin.json` wins and a stale duplicate would mask it.
- Release: bump `version` in `plugin.json`, add the matching `CHANGELOG.md` heading, run `node scripts/check-release-consistency.mjs`, then `claude plugin tag` -- it creates a `{name}--v{version}` git tag and validates that `plugin.json` agrees with the enclosing marketplace entry.

## Conventions

- Indentation: 2 spaces
- Naming: English, kebab-case for files and directories
- Encoding: UTF-8
- Paths: Relative in all plugin config. `scripts/` holds maintainer tooling only -- it is never invoked by the skills. If a script is ever referenced *from* a skill, use `${CLAUDE_PLUGIN_ROOT}`.
