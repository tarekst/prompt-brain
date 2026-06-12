---
name: optimize-prompt
description: Analyzes and optimizes any Claude Code prompt — identifies weaknesses, applies best practices, reconstructs the prompt, and generates a changelog. Use when refining, rewriting, or critiquing a prompt before sending it to Claude Code.
when_to_use: |
  Use when the user explicitly wants to refine, rewrite, or critique a prompt they intend to send to Claude Code. Typical triggers: "optimize this prompt", "make this prompt better", "rewrite as a plan mode prompt". Do NOT auto-invoke — this skill is manual-only (disable-model-invocation: true).
user-invocable: true
disable-model-invocation: true
argument-hint: [prompt to optimize]
model: claude-opus-4-8
---

# Prompt Optimization Algorithm

Execute the 5-step prompt optimization algorithm below, in order. Do NOT skip steps —
each step's output feeds the next.

## Input

The user's prompt to optimize:

$ARGUMENTS

If no prompt was provided, ask the user to provide the prompt they want optimized.

For worked input → optimized-output → changelog examples, see [examples.md](examples.md).

---

## Step 1: Parse & Intent Extraction

Decompose the original prompt into semantic components. Do not rewrite anything yet -- only understand.

Extract these 6 dimensions:

1. **Goal (What)**: What should exist when the task is complete?
2. **Phases (How)**: What work steps does the prompt describe?
3. **Scope (Where)**: Which files, URLs, directories, APIs are referenced?
4. **Agent Pattern**: Should subagents, parallel tasks, or sequential steps be used?
5. **Expected Outputs**: What artifacts should exist at the end?
6. **Implicit Assumptions**: What is assumed but never stated?

Build a mental model of these dimensions. Do not output this to the user -- use it internally for the next steps.

---

## Step 2: Weakness Analysis

Check the original prompt against each category below. For every weakness found, note the severity (CRITICAL / HIGH / MEDIUM / LOW), the specific problem, and a concrete fix.

### A. Missing Context Basis
- Is the current state analyzed before planning a change?
- Does Claude have enough context to complete the task without guessing?
- Typical problem: "Create a migration plan" without prior analysis -- plan based on assumptions
- Fix: Add an analysis phase before the main task

### B. Vague Output Specification
- Is it defined WHAT each output file should contain?
- Is there a template or schema for outputs?
- Are file names and paths explicit?
- Typical problem: "write all important information" -- every agent writes differently
- Fix: Define a markdown template with required sections

### C. Missing Sequencing
- Is it clear which steps depend on each other?
- Are there explicit "wait until X is done" conditions?
- Typical problem: Claude starts the final synthesis before research files are written
- Fix: Add explicit dependencies and wait conditions

### D. No Guardrails / Constraints
- Are there rules about what Claude should NOT do?
- Is hallucination of technical details prevented?
- Is there error handling (e.g., URL unreachable)?
- Typical problem: Claude invents API signatures not in the documentation
- Fix: Add a constraints block at the end of the prompt

### E. No Success Criteria
- Can you tell when each phase is successfully complete?
- Is there a definition of done?
- Typical problem: Claude says "done" but 3 of 14 files are empty or superficial
- Fix: Add test criteria per phase and per output

### F. Inefficient Structure
- Are instructions repeated?
- Are there meta-instructions ("be thorough", "be detailed") without concrete criteria?
- Is the prompt so long that the essentials get buried?
- Typical problem: "carefully crafted" does not tell Claude WHAT should be careful
- Fix: Replace vague adjectives with measurable criteria

### G. Subagent Instruction Issues
- Do all subagents have identical, clear instructions?
- Is it defined what an agent should do if its source is unavailable?
- Typical problem: 14 agents, each interprets "analyze and document" differently
- Fix: Shared template with error handling rules

Produce a prioritized weakness list internally. Do not output it to the user.

---

## Step 3: Best-Practice Matching

### Classify the Prompt Type

```
Is the prompt a...
|-- Multi-step workflow (multiple dependent phases)?
|   -> Apply phase template with dependencies
|   -> Recommend sequential execution
|-- Research / exploration task?
|   -> Subagent pattern with uniform output schema
|   -> Error handling for unreachable sources
|-- Code generation / refactoring?
|   -> Constraints: which files may be changed?
|   -> Verification: tests, linter, type checks as feedback loop
|   -> Rollback strategy on errors
|-- Analysis / review?
|   -> Recommend plan mode (no code edits)
|   -> Limit scope (which directories/files?)
|   -> Define output format (table, list, prose)
+-- Simple single task?
    -> Minimal optimization: clarity + output format only
    -> No overhead from phase splitting
```

### Apply Matching Practices

| Practice | When to apply | How to apply |
|----------|--------------|--------------|
| Phase separation | Multi-step workflows | Clear phase headers with dependencies |
| Output templates | Multiple similar outputs expected | Markdown schema as required structure |
| Constraints block | Always for technical tasks | Dedicated section at end of prompt |
| Explicit file paths | When files are created/read | Table with path + description |
| Numbered outputs | More than 3 output files | Prefix `00-`, `01-`, etc. |
| Current-state analysis | Migration / refactoring tasks | Dedicated phase before the main task |
| Subagent instructions | Parallel research tasks | Shared template + error handling |
| Sequencing hints | Token-intensive workflows | Note about phased execution |
| Verification step | Code changes | "Run tests/linter after each change" |
| Scope limitation | Vague "analyze everything" prompts | Name directories/files explicitly |

---

## Step 4: Prompt Reconstruction

Rebuild the prompt from scratch using the extracted intent, identified fixes, and matched practices. Follow these 5 rules:

### Rule 1: Preserve Intent, Replace Structure
The purpose of the prompt must never change. Reorder, reformulate, and restructure completely.

### Rule 2: Top-Down Structure
```
## Goal           <- 1-2 sentences: what should exist at the end
## Phase 1        <- First work phase with its own output
## Phase 2        <- Depends on Phase 1
## Phase N        <- ...
## Constraints    <- What Claude must NOT do
```

### Rule 3: Four Elements Per Phase
Every phase must have:
- **Input**: What does Claude need as input for this phase?
- **Task**: What exactly should be done?
- **Output**: What file(s) are produced, in what format?
- **Done criterion**: How to know the phase is complete?

### Rule 4: Language Rules
- Imperative over passive: "Analyze" not "It should be analyzed"
- Concrete over vague: "Write to `./research/01-overview.md`" not "document the results"
- Measurable over subjective: "with these 5 sections" not "detailed"
- No filler: "carefully", "thorough", "comprehensive" only when backed by structure

### Rule 5: Markdown Conventions
- `##` for phases
- `###` for sub-instructions within a phase
- Tables for mappings (URL -> file, current -> target)
- Code blocks for templates and expected file structures

---

## Step 5: Changelog Generation

Generate a human-readable changelog comparing the original and optimized prompt. The user must understand WHY each change was made.

### Format

```
## What was improved

### [Category, e.g. "Structure & Phases"]
- **[Change]** -- [Why this is better]

### [Category, e.g. "Subagent Instructions"]
- **[Change]** -- [Why this is better]
```

### Rules
- Every change is a **What -> Why** pair
- No generic justifications ("it's better") -- always name the concrete benefit
- Group by theme, not by position in the prompt
- Only significant changes -- skip cosmetic rephrasing

---

## Output Format

Present the result in exactly this structure:

### 1. The Optimized Prompt
Output the reconstructed prompt inside a fenced code block (triple backticks) so the user can copy it directly.

### 2. The Changelog
Output the changelog as rendered markdown (NOT in a code block) so headings, bold, and bullets display properly.

---

## Constraints

- **Preserve language**: If the input prompt is in German, the optimized prompt must also be in German. Match the original language.
- **No invented requirements**: Never add goals, constraints, or phases not implied by the original prompt.
- **Honest assessment**: If the prompt is already well-structured, say so. Do not force changes for the sake of changing.
- **No meta-commentary**: Do not explain the algorithm steps to the user. Just output the optimized prompt and changelog.
