# prompt-brain

## Architecture

A single-skill Claude Code plugin that optimizes user prompts using a 5-step algorithm:
Parse & Intent Extraction -> Weakness Analysis -> Best-Practice Matching -> Prompt Reconstruction -> Changelog Generation.

The algorithm is encoded entirely as skill instructions in `skills/optimize-prompt/SKILL.md`.
Claude Code is the runtime -- no external code, scripts, or services.

## Components

- **skills/optimize-prompt/SKILL.md** -- core skill with the 5-step algorithm (<=500 lines, ~1500-2000 words).
- **skills/optimize-prompt/examples.md** -- worked input -> optimized-output -> changelog examples (loaded on demand), plus a weakness quick-reference.
- **.claude-plugin/plugin.json** -- plugin manifest.
- **.claude-plugin/marketplace.json** -- single-plugin marketplace catalog for distribution via `/plugin marketplace add`.
- **evals/optimize-prompt.md** -- test scenarios with expected-behavior rubrics (out-of-band; never loaded by the skill).

## Usage

```
/prompt-brain:optimize-prompt [your prompt to optimize]
```

## Skill Frontmatter Policy

- `user-invocable: true` + `disable-model-invocation: true` -- this skill runs only when the user types `/prompt-brain:optimize-prompt`. Claude never auto-invokes it. Because `disable-model-invocation` is set, the skill's `description` is not loaded into context during normal sessions -- it only surfaces in the `/` menu, so optimize it for human readers, not auto-discovery keywords.
- `model: claude-opus-4-8` is pinned deliberately. The 5-step algorithm needs deep reasoning; do not downgrade without re-evaluating output quality. Keep this current with the latest Opus on each release.
- No `effort` field -- deliberately omitted so the skill inherits the session's current effort level. Omission is the only inherit mechanism (there is no `effort: inherit` value). Do not re-add a pinned effort value without re-evaluating; users who want full depth can run `/effort max` before invoking.
- No `allowed-tools` / `disallowed-tools`. `allowed-tools` only *pre-approves* tools (it never restricts them), so an empty list is a no-op -- it is intentionally omitted. The skill is a pure text transform and needs no tools beyond the default Read access used to load `examples.md` on demand. Do not re-add `allowed-tools: []`; it documents nothing.

## Progressive Disclosure

- `SKILL.md` holds the **entire** 5-step algorithm inline. This is deliberate: every invocation needs all 5 steps, so splitting them into a `reference.md` would force an always-load and risk Claude under-reading it. Progressive disclosure is for material needed on only *some* runs.
- Keep `SKILL.md` under 500 lines and roughly 1500-2000 words. It is currently well within budget.
- `examples.md` is the load-on-demand layer (calibration examples Claude reads when useful). `evals/` is out-of-band and never loaded by the skill.
- Only if `SKILL.md` genuinely outgrows the budget, extract the worked examples or the weakness quick-reference further -- not the core algorithm.

## Development Notes

- `.research/` is gitignored. It contains maintainer-local reference material (e.g. `PLUGIN_CREATION.md` snapshots). Do not commit research artifacts.
- Local testing: `claude --plugin-dir ./prompt-brain`.
- Validation: `claude plugin validate .` (validates `marketplace.json`) and `claude plugin validate ./prompt-brain` (validates `plugin.json` + SKILL.md frontmatter).
- In-session reload: `/reload-plugins`.

## Distribution

- Marketplace install: `/plugin marketplace add tarekst/prompt-brain` then `/plugin install prompt-brain@tarek-plugins`.
- The marketplace entry uses a GitHub source pointing at this same repo, so a new release reaches users when `version` in `plugin.json` is bumped. Do not also set `version` in the marketplace entry -- `plugin.json` wins and a stale duplicate would mask it.

## Conventions

- Indentation: 2 spaces
- Naming: English, kebab-case for files and directories
- Encoding: UTF-8
- Paths: Relative in all plugin config. No scripts exist today; if any are added later, reference them via `${CLAUDE_PLUGIN_ROOT}`.
