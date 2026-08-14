---
model: claude-sonnet-4-6
vendor: Anthropic
family: Claude
aliases: [sonnet, sonnet-4.6, claude-sonnet-4.6, sonnet4.6]
last_verified: 2026-06-13
---

# Claude Sonnet 4.6

## Reasoning / Thinking
- Typ: **adaptiv**. `thinking: {type: "adaptive"}` ist empfohlen. `budget_tokens` ist deprecatet (für neuen Code nicht verwenden; für Altcode nur als transitionaler Token-Deckel).
- Tiefensteuerung über `output_config.effort`: `low | medium | high | max`, Default `high`. `max` wird unterstützt (Opus-tier + Sonnet 4.6), `xhigh` jedoch nicht (Opus-4.7+-spezifisch).
- Für Chat/Klassifikation: `thinking: {type: "disabled"}` + `effort: "low"` liefert vergleichbare oder bessere Performance bei niedriger Latenz.

## Prompting-Stil
- Folgt dem System-Prompt deutlich enger als 4.5/ältere Modelle. Prompts, die die alte Zurückhaltung „überwinden" sollten, übertriggern jetzt — „CRITICAL: YOU MUST"/„Default to/If in doubt"-Tool-Sprache abmildern.
- Beste Balance aus Speed und Intelligenz; gut für hochvolumige Produktionsworkloads.
- Tool-Call-`input` immer parsen (Escaping kann abweichen), nie Raw-String-Match.

## Stärken & Schwächen (prompt-relevant)
- Stärken: schnelle, kosteneffiziente Ausführung; starke Instruktionsbefolgung; 1M Kontextfenster.
- Schwächen/Eigenheiten: bei höherem `effort` mehr Exploration/Tokens — `medium` ist oft der Sweet Spot; übermäßige Tool-/Skill-Aktivierung bei zu aggressiven Prompts.

## Output- & Format-Konventionen
- Assistant-Prefill (letzter Assistant-Turn) liefert 400 — Structured Outputs (`output_config.format`) oder System-Prompt-Anweisung nutzen.
- 1M Kontextfenster, bis 64K Output-Tokens; für große Outputs streamen.
- `output_format` (top-level, deprecated) → `output_config.format`.

## Migrations-Hinweise
- **VON Sonnet 4.6 weg**: zu Opus für die härtesten/längsten Aufgaben; zu Haiku für reine Speed/Kosten (dort kein `effort`-Parameter — entfernen).
- **ZU Sonnet 4.6 migrieren**: Von Sonnet 4.5 `effort` **explizit** setzen (4.6 defaultet auf `high` → höhere Latenz/Kosten sonst). `budget_tokens`→adaptive. GA-Beta-Header entfernen (`effort-2025-11-24`, `fine-grained-tool-streaming-2025-05-14`; `interleaved-thinking-2025-05-14` sobald adaptive) und von `client.beta.messages` auf `client.messages` zurückwechseln. Prefills entfernen. Aggressive Tool-Sprache abmildern.

## Quellen
- https://platform.claude.com/docs/en/about-claude/models/migration-guide — Sonnet 4.5 → 4.6: effort-Default `high`, empfohlene Startwerte, zu entfernende Beta-Header, Prefill-Ersatz, Prompt-Verhalten (Übertriggern).
- https://platform.claude.com/docs/en/about-claude/models/overview — Sonnet 4.6: 1M Kontext, 64K Output, adaptives Thinking.
- https://platform.claude.com/docs/en/build-with-claude/effort — Effort-Stufen (max für Sonnet 4.6, kein xhigh).
