# prompt-brain

## Architecture

A single-skill Claude Code plugin that optimizes user prompts using a 5-step algorithm:
Parse & Intent Extraction -> Weakness Analysis -> Best-Practice Matching -> Prompt Reconstruction -> Changelog Generation.

The algorithm is encoded entirely as skill instructions in `skills/optimize-prompt/SKILL.md`.
Claude Code is the runtime -- no external code, scripts, or services.

## Components

- **skills/optimize-prompt/SKILL.md** -- core skill with the 5-step algorithm (<=500 lines).
- **skills/optimize-prompt/examples.md** -- worked examples illustrating each prompt weakness category.

## Usage

```
/prompt-brain:optimize-prompt [your prompt to optimize]
```

## Skill Frontmatter Policy

- `user-invocable: true` + `disable-model-invocation: true` -- this skill runs only when the user types `/prompt-brain:optimize-prompt`. Claude never auto-invokes it.
- `model: claude-opus-4-7` is pinned deliberately. The 5-step algorithm needs deep reasoning; do not downgrade without re-evaluating output quality.
- `allowed-tools: []` -- the skill is a pure text transform. Adding tools changes its contract and requires a major version bump.
- `effort: max` -- full reasoning depth.

## Progressive Disclosure

- `SKILL.md` holds the algorithm. Keep it under 500 lines.
- `examples.md` holds worked examples.
- If `SKILL.md` exceeds ~400 lines, extract the weakness categories (A-G) or the best-practice catalog into `reference.md` and reference it from `SKILL.md`.

## Development Notes

- `.research/` is gitignored. It contains maintainer-local reference material (e.g. `PLUGIN_CREATION.md` snapshots). Do not commit research artifacts.
- Local testing: `claude --plugin-dir ./prompt-brain`.
- Validation: `claude plugin validate ./prompt-brain`.
- In-session reload: `/reload-plugins`.

## Conventions

- Indentation: 2 spaces
- Naming: English, kebab-case for files and directories
- Encoding: UTF-8
- Paths: Relative in all plugin config. No scripts exist today; if any are added later, reference them via `${CLAUDE_PLUGIN_ROOT}`.
