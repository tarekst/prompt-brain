# prompt-brain

A Claude Code plugin for working with prompts. **optimize-prompt** analyzes weaknesses, applies best practices, and reconstructs a prompt from scratch with a detailed changelog. **migrate-prompt** takes a prompt tuned for one model and re-tunes it for another, using per-model guides, and explains every change as a model-A → model-B changelog.

## Installation

```bash
# Recommended: add the marketplace, then install
claude plugin marketplace add tarekst/prompt-brain
claude plugin install prompt-brain@tarek-plugins
```

Or from inside Claude Code:

```
/plugin marketplace add tarekst/prompt-brain
/plugin install prompt-brain@tarek-plugins
```

For local development:

```bash
# Load from a local checkout (run from the repo root)
claude --plugin-dir .
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

### Migrating a prompt between models

```
/prompt-brain:migrate-prompt [current-model] [target-model] [prompt to migrate]
```

The first two tokens are the source and target models; everything after is the prompt. The
plugin resolves each model against its registry (canonical id or alias), reads **only** the
two matching model guides, then rewrites the prompt so it is idiomatic for the target model --
removing source-specific accommodations (e.g. `budget_tokens`, forced step-by-step, model
control tokens) and applying the target's conventions. Output: the migrated prompt plus a
migration changelog.

```
/prompt-brain:migrate-prompt deepseek-r1 claude-opus-4-8 <your R1-tuned prompt>
```

Supported models include Claude (Opus 4.8, Sonnet 4.6, Haiku 4.5, Fable 5), OpenAI (GPT-5,
GPT-5 mini, o3, GPT-4.1), Google (Gemini 2.5 Pro/Flash, Gemma 3), Meta (Llama 4
Maverick/Scout), xAI (Grok 4), Mistral (Large 2), and DeepSeek (R1, V3). Each lives as a guide
in [`skills/migrate-prompt/model-guides/`](skills/migrate-prompt/model-guides/); pass an
unknown model and the command lists what is available instead of guessing. Guide bodies are in
German and cite official vendor docs.

## How It Works

The optimization follows a 5-step algorithm:

| Step | What happens |
|------|-------------|
| 1. Parse & Intent Extraction | Decomposes the prompt into goal, phases, scope, and implicit assumptions |
| 2. Weakness Analysis | Checks against 7 categories: context, output spec, sequencing, guardrails, success criteria, efficiency, subagent instructions |
| 3. Best-Practice Matching | Classifies prompt type and selects applicable patterns |
| 4. Prompt Reconstruction | Rebuilds from scratch with top-down structure and measurable criteria |
| 5. Changelog Generation | Explains every change as a what->why pair |

The skill runs on Claude Opus 5 and inherits the session's current effort level. See
[`skills/optimize-prompt/examples.md`](skills/optimize-prompt/examples.md) for worked
input → optimized-output → changelog examples, and
[`evals/optimize-prompt.md`](evals/optimize-prompt.md) for the test scenarios.

## License

MIT
