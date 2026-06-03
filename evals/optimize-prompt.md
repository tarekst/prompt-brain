# Evaluations: optimize-prompt

Test scenarios for the `optimize-prompt` skill, following Anthropic's "build evaluations
first" guidance, adapted for a text-transform skill (no files, no scripts). These are NOT
loaded by the skill — they live at the repo root for out-of-band testing.

How to run: invoke `/prompt-brain:optimize-prompt <input>` for each scenario and confirm
every `expected_behavior` bullet holds. The skill passes a scenario only if all bullets are
satisfied.

---

## Scenario 1 — Vague single task

- **input:** `Fix the login bug`
- **expected_behavior:**
  - Outputs the reconstructed prompt inside a fenced code block.
  - Outputs the changelog as rendered markdown (headings/bold/bullets), not in a code block.
  - Adds explicit success criteria (a "done when" / verification step).
  - Adds a constraints block limiting scope.
  - Does NOT invent requirements beyond fixing the login bug.

## Scenario 2 — Multi-step research with parallel agents

- **input:** `Research these 10 libraries and write a comparison document. Check their GitHub repos, read their docs, and summarize pros and cons for each one.`
- **expected_behavior:**
  - Introduces a single shared output schema/template applied by every agent.
  - Adds error handling for unreachable sources (no fabricated metrics/APIs).
  - Makes the synthesis phase depend on the research phase (explicit sequencing).
  - Assigns concrete output file paths.

## Scenario 3 — Already well-structured prompt (honesty)

- **input:**
  ```
  ## Goal
  Add a dark mode toggle to the settings page.
  ## Phase 1
  Analyze src/components/Settings.tsx for the current theme logic.
  ## Phase 2
  Implement the toggle using the existing useTheme hook.
  ## Constraints
  Do not modify the global CSS. Only use CSS modules.
  ```
- **expected_behavior:**
  - Returns the prompt essentially unchanged (no fabricated phases or constraints).
  - Changelog states that no significant weaknesses were found.
  - Does NOT force structural changes for the sake of changing.

## Scenario 4 — Language preservation (German)

- **input:** `Analysiere unsere Codebasis und erstelle eine Architekturübersicht`
- **expected_behavior:**
  - The reconstructed prompt is written in German (matches input language).
  - The changelog is also in German.
  - German characters (ä, ö, ü) render correctly (UTF-8 preserved).
  - Replaces the vague "Architekturübersicht" with a concrete output spec (sections/path).

## Scenario 5 — Filler adjectives, no scope

- **input:** `Please carefully and thoroughly analyze the entire codebase and create a comprehensive, detailed architectural overview document that covers everything important`
- **expected_behavior:**
  - Removes/justifies filler adjectives ("carefully", "thoroughly", "comprehensive") by
    replacing them with measurable criteria (named sections, scope).
  - Limits scope (names directories/areas instead of "the entire codebase").
  - Defines the output document structure and path.
  - No meta-commentary explaining the algorithm to the user.
