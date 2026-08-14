---
model: claude-opus-5
vendor: Anthropic
family: Claude
aliases: [opus, opus-5, claude-opus5, opus5]
last_verified: 2026-08-14
status: current
---

# Claude Opus 5

## Reasoning / Thinking
- Typ: **adaptiv, per Default an**. Ein Request ohne `thinking`-Feld denkt — anders als Opus 4.8/4.7, wo dasselbe Request ohne Thinking lief. `{type: "adaptive"}` ist äquivalent zum Weglassen.
- Abschalten via `thinking: {type: "disabled"}` ist **nur bis effort `high`** erlaubt; kombiniert mit `xhigh`/`max` → 400.
- `thinking: {type: "enabled", budget_tokens: N}` ist entfernt (400). Tiefe ausschließlich über `output_config.effort` (`low | medium | high | xhigh | max`, Default `high`).
- Rohe Chain-of-Thought wird nie zurückgegeben; `display: "summarized"` liefert eine Zusammenfassung, Default `"omitted"` leere Thinking-Felder.
- Sampling-Parameter `temperature`/`top_p`/`top_k` auf Nicht-Default-Werten → 400.
- `max_tokens` ist ein hartes Limit über Thinking **plus** Antworttext — bei bisher thinking-freien Workloads neu bemessen. Bei `xhigh`/`max` mit ≥ 64k starten.

## Prompting-Stil
- **Explizit statt implizit**: Opus 5 interpretiert Prompts wörtlich, generalisiert eine Anweisung nicht stillschweigend auf andere Fälle und leitet keine ungestellten Anforderungen ab. Geltungsbereich ausschreiben.
- **Verifikations-Anweisungen entfernen**: Das Modell prüft seine Arbeit ungefragt. Übernommene „double-check your answer"/„include a final verification step"-Zeilen erzeugen Over-Verification — Streichen senkt Kosten ohne Qualitätsverlust.
- **Länge explizit vorgeben**: `effort` steuert Thinking-Volumen, nicht die sichtbare Antwortlänge — Absenken verkürzt Antworten nicht zuverlässig. Kurze Concise-Instruktion ergänzen, in langen System-Prompts zusätzlich als `<tone_preference>`-Reminder am Ende.
- **Scope begrenzen**: Das Modell erweitert Aufgaben mitunter um ungefragte Schritte; enge Aufgaben brauchen eine explizite Scope-Regel.
- **Delegation deckeln**: Opus 5 delegiert bereitwilliger an Sub-Agenten als Vorgänger — Kriterien nennen oder harte Obergrenze setzen.
- **Progress-Scaffolding streichen**: Zwischenstands-Choreografie („nach je 3 Tool-Calls zusammenfassen") ist überflüssig; stattdessen Kadenz und Form der Updates beschreiben.
- Lange agentische Läufe: vollständige Aufgabenspezifikation **vorab** in einem Turn geben und laufen lassen.

## Stärken & Schwächen (prompt-relevant)
- Stärken: schwierige agentische Coding-Aufgaben (Multi-File-Features, größere Refactorings, End-to-End-Arbeit) ohne Stubs/Platzhalter; Code-Review mit hoher Precision **und** Recall, auch bei niedrigem effort; Vision (Charts, Dokumente, Diagramme, UI-Replikation); Office-Artefakte (mehrblättrige Spreadsheets mit Formeln, Slide-Decks); Multi-Agent-Koordination mit Writer-Verifier-Mustern; konsistentes Instruction-Following über das gesamte 1M-Fenster.
- `low`/`medium` liefern starke Qualität bei einem Bruchteil von Tokens und Latenz — primärer Kosten-Hebel; von Vorgängermodellen übernommene effort-Defaults neu sweepen.
- Schwächen/Eigenheiten: längere sichtbare Antworten und längere geschriebene Deliverables als Vorgänger; ausgeprägte Narration in agentischen Sessions; narrativ ausführliche Selbstkorrekturen; Severity-Filter im Review-Prompt („nur high-severity") werden wörtlich befolgt und senken den gemessenen Recall.
- Mit abgeschaltetem Thinking zwei Artefakte: Tool-Calls landen gelegentlich als **Text** statt als `tool_use`-Block (Turn gilt als erfolgreich, der Call läuft nie), und interne XML-Tags können in die sichtbare Antwort lecken. Primäre Gegenmaßnahme laut Doku: Thinking anlassen und stattdessen effort senken.

## Output- & Format-Konventionen
- 1M-Kontextfenster als Default **und** Maximum (kein Beta-Header), 128k Output-Tokens; über die Message-Batches-API bis 300k Output mit Beta-Header `output-300k-2026-03-24`.
- Kein Assistant-Prefill — Structured Outputs (`output_config.format`) oder System-Prompt-Anweisungen nutzen.
- Tokenizer wie Opus 4.7/4.8: gegenüber Modellen vor Opus 4.7 rund 1×–1,35× so viele Tokens für denselben Text (inhaltsabhängig).
- Safety-Klassifikatoren können ablehnen: HTTP 200 mit `stop_reason: "refusal"` und `stop_details` — vor dem Lesen von `content` prüfen. Server-seitige Fallbacks über `fallbacks: "default"` (Beta `server-side-fallback-2026-07-01`).
- Preis $5 / MTok Input, $25 / MTok Output; Reliable Knowledge Cutoff Mai 2026.
- Minimal cachebares Prefix: **512 Tokens** (Opus 4.8: 1024) — Prompts, die bisher als zu kurz zum Cachen galten, cachen ohne Codeänderung. Beim Wechsel von 4.8 lohnt ein Cache-Eligibility-Review.
- effort ist Request-Level und Teil des gerenderten Prompts — innerhalb einer gecachten Konversation konstant halten, sonst bricht der Prompt-Cache.

## Migrations-Hinweise
- **VON Opus 5 weg**: explizite Verifikations- und Self-Check-Schritte wieder ergänzen, wenn das Zielmodell nicht selbst prüft; Concise-/Scope-/Delegations-Deckel-Instruktionen neu bewerten (sie kompensieren Opus-5-Eigenheiten); `fallbacks`-, `refusal`- und effort-Spezifika entfernen; bei Zielmodellen ohne adaptives Thinking wieder Step-by-step-Scaffolding bzw. `budget_tokens` vorsehen.
- **ZU Opus 5 migrieren**: `budget_tokens` und alle Sampling-Parameter entfernen; Assistant-Prefill durch Structured Outputs ersetzen; prüfen, ob eine Route `thinking: disabled` mit `xhigh`/`max` kombiniert (→ 400: Thinking anlassen oder effort auf `high` senken); `max_tokens` bei bisher thinking-freien Routen erhöhen; Verifikations- und Progress-Scaffolding **streichen**; Concise- und Scope-Instruktion ergänzen; Delegation deckeln; effort-Sweep neu fahren statt alte Defaults zu übernehmen; `refusal`-Handling ergänzen.

## Quellen
- https://platform.claude.com/docs/en/about-claude/models/overview — belegt id `claude-opus-5`, 1M Kontext, 128k Output, $5/$25, Knowledge Cutoff Mai 2026, effort-Default `high`, 300k-Output-Beta auf der Batches-API.
- https://platform.claude.com/docs/en/about-claude/models/migration-guide — Thinking per Default an, `disabled` nur bis effort `high` (sonst 400), `budget_tokens` entfernt, Sampling-Parameter abgelehnt, `display`-Default `omitted`, 1M ohne Beta-Header, Tokenizer 1×–1,35×.
- https://platform.claude.com/docs/en/build-with-claude/effort — alle fünf effort-Stufen für Opus 5, Default `high`, Empfehlung Start bei `high` mit frischem Sweep, `max_tokens` ≥ 64k bei `xhigh`/`max`, effort bricht Prompt-Cache bei Wechsel.
- https://platform.claude.com/docs/en/build-with-claude/prompt-caching — minimal cachebares Prefix 512 Tokens für Opus 5 gegenüber 1024 für Opus 4.8.
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5 — Verbosity/Deliverable-Länge, Over-Verification, Scope-Erweiterung, Sub-Agenten-Deckel, Selbstkorrektur-Narration, wörtliches Instruction-Following, die beiden Artefakte bei abgeschaltetem Thinking, Code-Review-Severity-Filter.
