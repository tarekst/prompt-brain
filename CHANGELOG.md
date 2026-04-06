# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
