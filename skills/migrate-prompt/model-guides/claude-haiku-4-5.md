---
model: claude-haiku-4-5
vendor: Anthropic
family: Claude
aliases: [haiku, haiku-4.5, claude-haiku-4.5, haiku4.5]
last_verified: 2026-06-13
---

# Claude Haiku 4.5

## Reasoning / Thinking
- Typ: **Extended Thinking** über `thinking: {type: "enabled", budget_tokens: N}` (mit `budget_tokens < max_tokens`, min 1024). Der **`effort`-Parameter wird NICHT unterstützt** und liefert einen Fehler (anders als Opus-tier / Sonnet 4.6).
- Schnellstes und kosteneffizientestes Modell — für einfache, latenzkritische Tasks (Klassifikation, kurze Extraktion).

## Prompting-Stil
- Knapp und einfach halten; klare, direkte Instruktionen. Für komplexes mehrstufiges Reasoning ist ein größeres Modell besser geeignet.
- Eigener Rate-Limit-Pool, getrennt von Haiku 3/3.5 — bei Volumen-Migration Tier prüfen.

## Stärken & Schwächen (prompt-relevant)
- Stärken: niedrige Latenz/Kosten; gut für hochvolumige, klar umrissene Aufgaben.
- Schwächen: kein `effort`-Parameter; geringere Reasoning-Tiefe als Opus/Sonnet — komplexe Logik explizit per Prompt strukturieren.

## Output- & Format-Konventionen
- Structured Outputs werden unterstützt (`output_config.format`).
- Assistant-Prefill ist für Haiku 4.5 **nicht** als entfernt dokumentiert (anders als Opus 4.6+/Sonnet 4.6); im Zweifel Structured Outputs statt Prefill nutzen.
- 200K Kontextfenster, bis 64K Output-Tokens.

## Migrations-Hinweise
- **VON Haiku 4.5 weg** (zu Opus/Sonnet): `effort`/adaptives Thinking werden verfügbar — Tiefe lässt sich feiner steuern; mehr Reasoning-Spielraum.
- **ZU Haiku 4.5 migrieren**: `effort`-Parameter aus Requests entfernen (sonst Fehler); für Thinking `enabled`+`budget_tokens` nutzen; Prompts vereinfachen und Aufgaben eng umreißen; separaten Rate-Limit-Tier einplanen.

## Quellen
- https://platform.claude.com/docs/en/about-claude/models/overview — Haiku 4.5: 200K Kontext, 64K Output, Positionierung als schnellstes/günstigstes Modell.
- https://platform.claude.com/docs/en/about-claude/models/migration-guide — `effort` erzeugt auf Haiku 4.5 einen Fehler; separater Rate-Limit-Pool ggü. Haiku 3.x; Structured-Outputs-Unterstützung.
- https://platform.claude.com/docs/en/build-with-claude/extended-thinking — `enabled`+`budget_tokens` (budget < max_tokens, min 1024).
