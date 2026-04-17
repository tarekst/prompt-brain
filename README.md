# prompt-brain

A Claude Code plugin that optimizes your prompts. Analyzes weaknesses, applies best practices, and reconstructs prompts from scratch with a detailed changelog explaining every improvement.

## Installation

```bash
# Development (load from local directory)
claude --plugin-dir ./prompt-brain

# Or install to user scope
claude plugin install ./prompt-brain
```

## Usage

```
/prompt-brain:optimize-prompt [your prompt to optimize]
```

Paste your prompt after the command. The plugin will:
1. Parse the prompt's intent and structure
2. Analyze it against 7 weakness categories
3. Match best practices for the prompt type
4. Reconstruct it from scratch
5. Generate a changelog explaining every change

### Example

```
/prompt-brain:optimize-prompt Analyze the codebase and create a migration plan for the new API
```

Output: An optimized prompt with proper phases, output specifications, constraints, and success criteria -- plus a changelog explaining what was improved and why.

## How It Works

The optimization follows a 5-step algorithm:

| Step | What happens |
|------|-------------|
| 1. Parse & Intent Extraction | Decomposes the prompt into goal, phases, scope, and implicit assumptions |
| 2. Weakness Analysis | Checks against 7 categories: context, output spec, sequencing, guardrails, success criteria, efficiency, subagent instructions |
| 3. Best-Practice Matching | Classifies prompt type and selects applicable patterns |
| 4. Prompt Reconstruction | Rebuilds from scratch with top-down structure and measurable criteria |
| 5. Changelog Generation | Explains every change as a what->why pair |

## License

MIT
