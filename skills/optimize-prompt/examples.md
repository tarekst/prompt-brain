# Examples: optimize-prompt

Each example illustrates a typical prompt weakness that the optimizer addresses.

## 1. Simple vague prompt
`/prompt-brain:optimize-prompt Fix the login bug`

Weaknesses: missing scope, no success criteria, no output format.

## 2. Multi-step workflow without sequencing
`/prompt-brain:optimize-prompt Read all the docs at https://example.com/api, then analyze our codebase, then create a migration plan and write it to a file`

Weaknesses: no dependencies between phases, no output file paths.

## 3. Research task with parallel agents
`/prompt-brain:optimize-prompt I need you to research these 10 libraries and write a comparison document. Check their GitHub repos, read their docs, and summarize pros and cons for each one.`

Weaknesses: no shared schema for parallel agents, no error handling for unreachable sources.

## 4. Code generation without constraints
`/prompt-brain:optimize-prompt Refactor the entire authentication module to use JWT tokens instead of session cookies`

Weaknesses: no scope boundary (which files), no verification step, no rollback strategy.

## 5. Analysis with no output format
`/prompt-brain:optimize-prompt Look at our test coverage and tell me what's missing`

Weaknesses: no output format, no scope limit, no definition of "missing".

## 6. Subagent task with no shared template
`/prompt-brain:optimize-prompt Spawn agents to analyze each microservice in the services/ directory and document their APIs`

Weaknesses: no shared output schema, no error handling.

## 7. Migration without current-state analysis
`/prompt-brain:optimize-prompt Migrate our frontend from React class components to hooks`

Weaknesses: no current-state analysis phase, no verification step.

## 8. Complex prompt with filler words
`/prompt-brain:optimize-prompt Please carefully and thoroughly analyze the entire codebase and create a comprehensive, detailed architectural overview document that covers everything important`

Weaknesses: filler adjectives without measurable criteria, no scope limit, no output structure.

## 9. Multi-output task without file paths
`/prompt-brain:optimize-prompt Create documentation for all our API endpoints, database models, and deployment process`

Weaknesses: no output file paths, no output templates.

## 10. Well-structured prompt (edge case)
`/prompt-brain:optimize-prompt ## Goal\nAdd a dark mode toggle to the settings page.\n## Phase 1\nAnalyze src/components/Settings.tsx for the current theme logic.\n## Phase 2\nImplement the toggle using the existing useTheme hook.\n## Constraints\nDo not modify the global CSS. Only use CSS modules.`

Expected: optimizer returns the prompt largely unchanged with a changelog stating "no significant weaknesses found" — tests honesty constraint.
