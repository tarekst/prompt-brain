# Examples: optimize-prompt

Worked examples that calibrate the optimizer. Each shows the invocation, the reconstructed
prompt (the optimizer outputs this in a fenced code block), and the rendered changelog.
A condensed weakness quick-reference follows at the end.

---

## Example 1 — Vague simple prompt

**Invocation**

`/prompt-brain:optimize-prompt Fix the login bug`

**Optimized prompt** (output as a fenced code block):

```
## Goal
Fix the bug that prevents users from logging in.

## Phase 1 — Reproduce & locate
- Input: the failing login flow and any error message the user reported.
- Task: reproduce the failure, then trace it to the responsible code. Identify the root
  cause (do not patch symptoms).
- Output: a one-line statement of the root cause and the file:line where it lives.
- Done when: the cause is named and confirmed by reproducing it.

## Phase 2 — Fix & verify
- Input: the root cause from Phase 1.
- Task: implement the minimal fix.
- Output: the edited file(s) plus the command used to verify the login flow now works.
- Done when: the previously failing login succeeds and existing auth tests still pass.

## Constraints
- Do not refactor unrelated code or change the auth contract.
- If the root cause cannot be confirmed, report findings instead of guessing a fix.
```

**Changelog** (rendered, not in a code block):

## What was improved

### Scope & success criteria
- **Split into reproduce → fix phases with explicit "done" criteria** — the original gave
  no way to know when the bug was actually fixed versus merely masked.

### Output specification
- **Named the expected artifacts (root cause, edited files, verification command)** — so
  the result is checkable rather than a vague "fixed it".

### Guardrails
- **Added a constraints block** — prevents scope creep and forbids guessing when the cause
  is unconfirmed, the most common failure mode for a one-line bug prompt.

---

## Example 2 — Multi-step research with parallel agents

**Invocation**

`/prompt-brain:optimize-prompt I need you to research these 10 libraries and write a comparison document. Check their GitHub repos, read their docs, and summarize pros and cons for each one.`

**Optimized prompt** (output as a fenced code block):

```
## Goal
Produce a single comparison document evaluating the 10 libraries, with a uniform
pros/cons summary for each.

## Phase 1 — Research (parallel, one agent per library)
- Input: the list of 10 libraries.
- Task: spawn one subagent per library. Each agent uses the SAME template below.
- Per-agent output: write to `./research/<library-name>.md` using this schema:
    # <Library>
    ## Overview        (1–2 sentences)
    ## Maturity        (stars, last release, open issues — from the GitHub repo)
    ## Pros            (3–5 bullets, each tied to evidence)
    ## Cons            (3–5 bullets, each tied to evidence)
    ## Sources         (URLs consulted)
- Error handling: if a repo or doc page is unreachable, write "SOURCE UNAVAILABLE" under
  the affected section instead of inventing details.
- Done when: all 10 files exist and every required section is filled.

## Phase 2 — Synthesis
- Input: the 10 files from Phase 1 (wait until all exist).
- Task: build a comparison table (rows = libraries, columns = the schema sections) and a
  short recommendation.
- Output: `./research/00-comparison.md`.
- Done when: the table has 10 rows and the recommendation cites specific tradeoffs.

## Constraints
- Do not fabricate metrics or API details — only report what the sources show.
- Do not start Phase 2 before all Phase 1 files are written.
```

**Changelog** (rendered):

## What was improved

### Subagent instructions
- **Gave every agent one shared output schema** — without it, 10 agents produce 10
  incompatible formats that cannot be compared in Phase 2.
- **Added explicit error handling for unreachable sources** — stops agents from
  hallucinating stars, releases, or API signatures.

### Sequencing
- **Made synthesis depend on all research files** — prevents the comparison from starting
  before the inputs exist.

### Output specification
- **Assigned concrete file paths (`./research/<name>.md`, `00-comparison.md`)** — replaces
  the undefined "a comparison document".

---

## Example 3 — Already well-structured prompt (honesty edge case)

**Invocation**

```
/prompt-brain:optimize-prompt ## Goal
Add a dark mode toggle to the settings page.
## Phase 1
Analyze src/components/Settings.tsx for the current theme logic.
## Phase 2
Implement the toggle using the existing useTheme hook.
## Constraints
Do not modify the global CSS. Only use CSS modules.
```

**Optimized prompt** (returned essentially unchanged):

```
## Goal
Add a dark mode toggle to the settings page.

## Phase 1 — Analyze
Analyze `src/components/Settings.tsx` for the current theme logic.

## Phase 2 — Implement
Implement the toggle using the existing `useTheme` hook.

## Constraints
- Do not modify the global CSS. Use CSS modules only.
```

**Changelog** (rendered):

## What was improved

No significant weaknesses found. The prompt already has a clear goal, sequenced phases
with a current-state analysis before the change, an explicit scope (one file, one hook),
and a constraints block. Only cosmetic touches were applied (inline-code formatting for
the file and hook names). No structural changes were warranted.

---

## Weakness quick-reference

Short prompts and the primary category each one exercises (A–G map to the Step 2
weakness catalog in `SKILL.md`):

| Prompt | Primary weakness(es) |
|--------|----------------------|
| `Fix the login bug` | B (output), E (success criteria), D (guardrails) |
| `Read the docs at <url>, analyze our codebase, then write a migration plan to a file` | C (sequencing), B (output paths) |
| `Refactor the entire auth module to use JWT instead of session cookies` | D (scope/guardrails), E (verification), no rollback |
| `Look at our test coverage and tell me what's missing` | B (output format), F (scope), undefined "missing" |
| `Spawn agents to analyze each microservice and document their APIs` | G (shared schema), D (error handling) |
| `Migrate our frontend from React class components to hooks` | A (current-state analysis), E (verification) |
| `Please carefully and thoroughly analyze the entire codebase and create a comprehensive overview` | F (filler adjectives, no scope, no structure) |
| `Create documentation for all our API endpoints, database models, and deployment process` | B (no paths/templates) |
