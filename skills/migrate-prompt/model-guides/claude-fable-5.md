---
model: claude-fable-5
vendor: Anthropic
family: Claude
aliases: [fable, fable-5, fable5]
last_verified: 2026-06-13
status: current
---

# Claude Fable 5

## Reasoning / Thinking
- Typ: **immer an**. `thinking` einfach weglassen (adaptives Thinking ist automatisch aktiv); ein expliziter `{type: "disabled"}` liefert 400, ebenso `{type: "enabled", budget_tokens: N}`. Tiefe ausschließlich über `output_config.effort` steuern (`low | medium | high | xhigh | max`).
- Die rohe Chain-of-Thought wird nie zurückgegeben. `display: "summarized"` liefert eine Zusammenfassung, Default `"omitted"` liefert leere Thinking-Blöcke. Auf demselben Modell Thinking-Blöcke unverändert zurückgeben; andere Modelle verwerfen sie (und rechnen sie nicht ab).
- Sampling-Parameter `temperature`/`top_p`/`top_k` sind entfernt (400).

## Prompting-Stil
- **Längere Turns** (einzelne Requests laufen bei hartem effort minutenlang) — Timeouts/Streaming/asynchrone Check-ins einplanen.
- Profitiert stark von expliziten Kommunikations-/Verhaltens-Sektionen im System-Prompt: Anti-Overplanning („wenn genug Info da ist, handeln"), No-Tidying (kein ungefragtes Refactoring), Grounded-Progress (Statusaussagen gegen Tool-Ergebnisse prüfen), Boundaries (nur tun, was verlangt ist), async Sub-Agenten, Memory-Datei, optional ein `send_to_user`-Tool für wortgetreue Zwischenausgaben.
- Migrierte Prompts/Skills **entschlacken**: über-präskriptives Step-by-step-Scaffolding senkt die Qualität — Ziel + Constraints statt Schrittliste.

## Stärken & Schwächen (prompt-relevant)
- Stärken: stärkstes Reasoning und Long-Horizon-Agentic; First-Shot-Implementierungen gut spezifizierter Systeme; Vision auf dichten/degradierten Bildern; zuverlässige parallele/async Sub-Agenten.
- Schwächen/Eigenheiten: `stop_reason: "refusal"` durch Safety-Classifier (v. a. Bio/Cyber; HTTP 200) → vor dem Lesen von `content` prüfen, Fallbacks per Default opt-in; **30-Tage-Retention erforderlich** (ZDR → 400 bei jedem Request); kein Assistant-Prefill; selten frühes Stoppen/„Kontext-Angst" in sehr langen Sessions (per Reminder gegensteuern).

## Output- & Format-Konventionen
- Assistant-Prefill nicht unterstützt — Structured Outputs (`output_config.format`) oder System-Prompt-Anweisungen nutzen.
- 1M Kontextfenster (Default), bis 128K Output-Tokens; für große Outputs streamen.
- `stop_reason == "refusal"` immer vor `content[0]` behandeln; server-seitige `fallbacks` (Beta `server-side-fallback-2026-06-01`, Fallback `claude-opus-4-8`) per Default mitgeben.

## Migrations-Hinweise
- **VON Fable 5 weg**: andere Modelle ignorieren Fable-Thinking-Blöcke (werden aus dem Prompt entfernt, unbelastet); Prefill ist anderswo wieder erlaubt; `effort`-Stufen können abweichen; Refusal-/Fallback-Spezifika entfernen.
- **ZU Fable 5 migrieren**: jegliche `thinking`-Konfiguration entfernen (inkl. `disabled`); `temperature`/`top_p`/`top_k` und Prefills entfernen; 30-Tage-Retention sicherstellen; `refusal`-Handling + Fallbacks ergänzen; effort-Sweep inkl. `low`/`medium` für Routinearbeit; Timeouts/Streaming für lange Turns; über-präskriptives Scaffolding entfernen und stattdessen Verhaltens-Sektionen ergänzen.

## Quellen
- https://platform.claude.com/docs/en/about-claude/models/migration-guide — Migrating to Claude Fable 5: Thinking immer an (disabled/budget_tokens → 400), raw CoT nie zurückgegeben, refusal-Handling + Fallbacks, 30-Tage-Retention, Verhaltens-Snippets, lange Turns.
- https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5 — Fähigkeiten/Verfügbarkeit, Refusal-Klassifizierer, Fallbacks.
- https://platform.claude.com/docs/en/about-claude/models/overview — Fable 5: 1M Kontext, 128K Output, Tokenizer wie Opus 4.8, ZDR nicht verfügbar.
- https://platform.claude.com/docs/en/build-with-claude/effort — Effort-Stufen `low`–`xhigh`/`max`.
