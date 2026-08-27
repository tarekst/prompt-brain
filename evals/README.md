# evals

Machine-runnable eval suite for the two prompt-brain skills. Every scenario lives in its own
directory as a `case.yaml`, discovered by the Claude Code CLI as `evals/**/case.yaml`.

```
evals/
  optimize-prompt/<nn>-<slug>/case.yaml
  migrate-prompt/<nn>-<slug>/case.yaml
```

`evals/` is **out-of-band**: neither skill ever loads anything from this directory at runtime.
It exists purely for maintainer testing, the same way `scripts/` and `.github/` do.

## Running the suite

From the repo root:

```bash
claude plugin eval .
```

Useful flags:

| Flag | Effect |
|------|--------|
| `--case <glob>` | Run only the cases whose path matches the glob (e.g. `--case 'migrate-prompt/*'`). |
| `--tag <tag>` | Run only cases carrying that tag (e.g. `--tag degenerate`). |
| `--threshold <0..1>` | Fail the run when the aggregate score falls below the given fraction. |
| `--ablation with-without` | Add a second, no-plugin baseline arm alongside the with-plugin arm. |

**`claude plugin eval` is currently EARLY ACCESS.** Running `claude plugin eval help` prints
that notice, and the subcommand may not execute on every account yet. If the command refuses
to run for you, that is the gate — not a problem with these case files.

### Ablation arms

With `--ablation with-without`, each case runs twice: once with the plugin loaded and once
without. Graders marked `arm: with-only` are **plugin-fired indicators**, not part of the
comparative score — the `skill-invoked` grader in every case is one of these, because a
baseline arm without the plugin can never fire the `Skill` tool. All other graders run in both
arms so the delta is meaningful.

## Grader conventions used here

- **Lazy loading is the central contract of `migrate-prompt`.** Every migrate case pins the
  number of `Read` calls against `model-guides/`: `max: 0` for the cases that must stop before
  loading anything, and `min: 2, max: 2` for every happy path — plus per-file graders naming
  the two guides that must be read and, where it matters, the guides that must *not* be.
- **Mechanical over judgmental.** Structural assertions (a fenced code block is present, the
  changelog sits outside the fence, a `Guide-Stand` footer exists, umlauts survive as UTF-8)
  are `regex` graders. `llm` graders are reserved for genuinely judgment-based bullets —
  intent preserved, no invented requirements, an honest "few changes apply" verdict.
- **`expected_outcome`** carries the original human-readable rationale for each scenario. The
  graders encode it; `expected_outcome` explains it.

## Run record

| Date | Plugin version | CLI version | Model | Cases run | Result | Notes |
|------|----------------|-------------|-------|-----------|--------|-------|
| 2026-08-27 | 0.7.0 | 2.1.246 | `claude-opus-5` (skill-pinned) | 0 of 23 | not run | Suite authored and schema-validated against CLI 2.1.246. **Not executed**: `claude plugin eval` is early-access-gated and was unavailable on this account. No pass/fail data exists yet. |

Add a row per execution. Do not backfill a row for a run that did not happen.
