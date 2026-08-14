---
model: claude-opus-4-8
vendor: Anthropic
family: Claude
aliases: [opus-4.8, claude-opus-4.8, opus4.8]
last_verified: 2026-06-13
status: legacy
successor: claude-opus-5
---

# Claude Opus 4.8

## Reasoning / Thinking
- Typ: **adaptiv**. Nur adaptives Thinking: `thinking: {type: "adaptive"}`. `thinking: {type: "enabled", budget_tokens: N}` ist entfernt und liefert 400. `{type: "disabled"}` und das Weglassen von `thinking` sind erlaubt (kein Thinking).
- Tiefensteuerung über `output_config.effort`: `low | medium | high | xhigh | max`, Default `high`. `xhigh` ist für die meisten Coding-/Agentic-Fälle der Sweet Spot; `medium`/`high`/`xhigh` pro Route sweepen. `max` nur für sehr harte, latenzunkritische Aufgaben.
- `thinking.display` ist standardmäßig `"omitted"` (leere Thinking-Blöcke). Für sichtbare Zusammenfassungen `display: "summarized"` setzen.
- Sampling-Parameter `temperature`/`top_p`/`top_k` sind entfernt (400) — Steuerung über Prompt + effort.

## Prompting-Stil
- Sehr hohe Instruktionstreue; gleiche Request-Oberfläche wie Opus 4.7 (keine neuen Breaking Changes).
- Narriert mehr als 4.7 (mehr Text zwischen Tool-Calls, längere Abschluss-Summaries). Für knappe Coding-Agents eine Silence-Default-Instruktion ergänzen; vorhandenes „after every N tool calls"-Scaffolding entfernen.
- Deliberativer — fragt bei Kleinentscheidungen häufiger nach und hängt „Want me to also…?" an. Gegensteuern: „bei Kleinentscheidungen (Naming, Defaults, gleichwertige Ansätze) selbst entscheiden statt fragen; bei Scope-Änderungen/destruktiven Aktionen weiter fragen".
- Greift konservativer zu Web-Suche, Subagenten, Datei-Memory und Custom Tools. Triggerbedingungen explizit nennen — im System-Prompt UND in der jeweiligen Tool-`description` („Call this when …").
- Mid-Session-System-Messages (Beta `mid-conversation-system-2026-04-07`): `{"role":"system"}` in `messages[]` anhängen statt den Top-Level-System-Prompt zu ändern (erhält den Prompt-Cache).

## Stärken & Schwächen (prompt-relevant)
- Stärken: State-of-the-art bei langen, autonomen Agentic-Läufen, Knowledge-Work und Memory; klarere, wärmere Prosa; starke Bug-Findung/Debugging.
- Schwächen/Eigenheiten: höhere Default-Verbosity in der Narration; Unter-Nutzung von Tools/Subagenten ohne explizite Trigger; bei `thinking: {type:"disabled"}` rutscht Reasoning teils in die sichtbare Antwort (adaptive Thinking anlassen oder Final-Answer-only-Instruktion).
- Code-Review: folgt „nur High-Severity"-Filtern wörtlich → Recall kann sinken. „Alles melden, Filterung in einem separaten Schritt"-Muster nutzen.

## Output- & Format-Konventionen
- Assistant-Prefill (letzter Assistant-Turn) liefert 400 — stattdessen Structured Outputs (`output_config.format`) oder System-Prompt-Anweisung.
- 1M Kontextfenster, bis 128K Output-Tokens; für große Outputs streamen (`.stream()` / `get_final_message()`).
- Tool-Call-`input` immer mit `json.loads`/`JSON.parse` parsen (Escaping kann variieren), kein Raw-String-Matching.

## Migrations-Hinweise
- **VON Opus 4.8 weg** (zu älteren/anderen Modellen): ggf. wieder präskriptiveres Scaffolding und explizites Step-by-step ergänzen; Prefill ist auf vielen Modellen wieder erlaubt; `effort`/`xhigh` ggf. nicht verfügbar → Tiefe per Prompt steuern.
- **ZU Opus 4.8 migrieren**: Von Opus 4.7 ist es ein Modell-ID-Tausch plus Prompt-Re-Tuning (keine neuen Breaking Changes). Von 4.6/älter: `budget_tokens`→adaptive, `temperature`/`top_p`/`top_k` entfernen, Prefills entfernen. Dann: Search-First-Instruktion, Autonomie-Hinweis (weniger nachfragen), Silence-Default bei zu viel Narration; aggressive „CRITICAL/MUST"-Tool-Sprache abmildern.

## Quellen
- https://platform.claude.com/docs/en/about-claude/models/migration-guide — Migrating to Opus 4.8: keine neuen Breaking Changes, Verhaltens-Re-Tuning (Narration, Autonomie, Tool-Triggering), Mid-Session-System-Messages, effort-Sweep.
- https://platform.claude.com/docs/en/about-claude/models/overview — Opus 4.8: 1M Kontext, 128K Output, adaptives Thinking, Sampling-Parameter/`budget_tokens` entfernt.
- https://platform.claude.com/docs/en/build-with-claude/effort — Effort-Stufen inkl. `xhigh`/`max`, Default `high`.
- https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking — adaptives Thinking, `display`-Verhalten.
