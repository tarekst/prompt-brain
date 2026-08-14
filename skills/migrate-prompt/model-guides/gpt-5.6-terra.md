---
model: gpt-5.6-terra
vendor: OpenAI
family: GPT
aliases: [terra, gpt5.6-terra, 5.6-terra]
last_verified: 2026-08-14
status: current
---

# GPT-5.6 Terra

## Reasoning / Thinking
- Gleiche Reasoning-Steuerung wie das Flaggschiff: `reasoning.effort` mit `none | low | medium (Default) | high | xhigh | max`. Semantik: `none` für latenzkritische Aufgaben ohne Reasoning-Nutzen, `low` = „Efficient reasoning with a modest latency increase", `medium` als ausgewogener Default, `high` für „Hard reasoning, complex debugging, deep planning", `xhigh` für „Deep research, asynchronous workflows and agentic tasks", `max` für „Maximum reasoning for your most complex tasks".
- Zusätzlich `reasoning.mode` = `standard` (Default) / `pro` — unabhängig von `effort`; `pro` leistet mehr Modellarbeit bei höherer Latenz/Kosten. Und `reasoning.context` = `auto | current_turn | all_turns`, bei GPT-5.6-Modellen Default `all_turns`. Auf dieser Preis-/Leistungs-Stufe: bei `medium` (Default) starten, `low` für latenzkritische Pfade testen, `effort` unabhängig von anderen Parametern vergleichen.

## Prompting-Stil
- **Schlanke Prompts**: wiederholte Anweisungen und redundante Beispiele entfernen, jede Anweisung genau einmal formulieren, nur relevante Tools mit knappen, präzisen Beschreibungen exponieren. OpenAI misst dadurch ~10–15 % bessere Eval-Scores bei 41–66 % weniger Tokens (Stichprobe interner Coding-Agent-Evals; die Doku bezeichnet die Spannen ausdrücklich als „directional"). Beispiele nur behalten, wenn sie Produktanforderungen kodieren oder eine gemessene Lücke schließen.
- Antwortlänge bewusst setzen: `text.verbosity` (`low`/`medium`/`high`) als Baseline, task-spezifische Vorgaben im Prompt darüber. Bei Kürze benennen, was überleben muss: „Keep all required facts, decisions, caveats, and next steps. Trim introductions, repetition, generic reassurance, and optional background first."
- Autonomie- und Freigabegrenzen explizit definieren: sichere lokale Aktionen (Dateien lesen, Code editieren, Tests laufen lassen) namentlich erlauben, Bestätigung verlangen für „external writes, destructive actions, purchases, or a material expansion of scope".
- Für Tool-/Routing-Arbeit zulässige Tools und exakte Output-Schemata benennen. Programmatic Tool Calling passt zu begrenzten Aggregations-/Filter-Workflows mit starker Zwischendatenreduktion — schlecht, wenn ein Call reicht, Zwischenergebnisse klein sind oder jedes Ergebnis die nächste Entscheidung ändert.

## Stärken & Schwächen (prompt-relevant)
- Positionierung: „designed for workloads that balance intelligence and cost", entspricht grob der Mini-Stufe früherer GPT-5-Familien; im Modell-Guide „strong performance at a lower price".
- Erbt die Familien-Eigenschaften: Frontier-Qualität mit weniger Output-Tokens, stärkeres Front-End-/Design-Urteil, besseres Ableiten des eigentlichen Nutzerziels und des gewünschten Arbeitsumfangs aus dem Kontext.
- Schwächen: nicht das Frontier-Modell — qualitätskritische bzw. härteste Reasoning-Arbeit gehört auf `gpt-5.6-sol` (ggf. mit `reasoning.mode: "pro"`). Realtime, Assistants, Fine-tuning, Embeddings sowie Audio-/Bild-/Video-Endpunkte werden nicht unterstützt. Familienweites Safeguard-Verhalten gilt auch hier: Generierung kann mid-stream mehrere Sekunden pausieren, während Klassifizierer den Output synchron prüfen — Timeouts/Streaming entsprechend auslegen.

## Output- & Format-Konventionen
- Kontextfenster 1.050.000 Tokens, max. Input 922.000, max. Output 128.000 Tokens; Knowledge-Cutoff 16. Feb. 2026. Input: Text + Bild, Output: Text.
- Endpunkte: Chat Completions, Responses, Batch. Features: Streaming, Structured Outputs, Function Calling, File Search, Bild-Input, Web Search, Prompt Caching. Nur ein Snapshot gelistet: `gpt-5.6-terra` — keine datierte Snapshot-ID, kein dokumentierter Kurz-Alias.
- Detailgrad über `text.verbosity` = `low | medium | high`, nicht über Prosa-Anweisungen im Prompt.
- Preise je 1M Tokens: Input $2, Cached Input $0,2, Output $12; Regel: „Prompts with >272K input tokens are priced at 2x input and 1.5x output for the full request" (Cache-Writes 1,25x Input-Rate).

## Migrations-Hinweise
- **VON gpt-5.6-terra weg**: `reasoning.effort`, `reasoning.mode`, `reasoning.context` und `text.verbosity` entfernen (keine vendorübergreifenden Äquivalente); explizite Kürze-/Format-Anweisungen und die vom Ziel benötigten Beispiele wieder in den Prompt schreiben; Annahmen über 1,05M Kontext und 128K Output schrumpfen.
- **ZU gpt-5.6-terra migrieren**: offizieller Nachfolger von `gpt-5-mini-2025-08-07` (Shutdown 11.12.2026). (1) Bestehenden Effort als Baseline behalten und eine Stufe darunter gegentesten („preserve your current reasoning effort as the baseline, then compare one level lower" — die Doku formuliert das für Migrationen von GPT-5.5/5.4; für gpt-5-mini als Ausgangspunkt ist es eine Übertragung). (2) Prompt hart entschlacken: duplizierte Anweisungen, gestapelte Few-Shot-Beispiele und aufgeblähte Tool-Beschreibungen aus der gpt-5-mini-Ära löschen. (3) Pauschale Kürze-Zeilen entfernen oder neu testen — GPT-5.6 ist von Haus aus knapper als GPT-5.5, „Be concise" kann jetzt überkürzen; Default über `text.verbosity`, im Prompt nur task-spezifische Längen-/Formatregeln. (4) Für Reasoning, Tool Calling und Multi-Turn die Responses API bevorzugen; `reasoning.context` auf `auto`/`all_turns`, `current_turn` wenn früheres Reasoning irrelevant ist. (5) Autonomie-/Freigabegrenzen explizit ergänzen. (6) Nur bei gemessener Qualitätslücke auf `gpt-5.6-sol` (ggf. `reasoning.mode: "pro"`) eskalieren; Terra ist die Balance-Stufe („strong performance at a lower price"), `gpt-5.6-luna` die günstigere Nano-Stufe darunter „for efficient, high-volume workloads".

## Quellen
- https://developers.openai.com/api/docs/models/gpt-5.6-terra — Modell-ID, Mini-Tier-Positionierung, 1.050.000 Kontext / 922.000 Input / 128.000 Output, Cutoff 16.02.2026, Effort-Stufen, Endpunkte/Features, Preise $2/$0,2/$12 und die >272K-Token-Regel.
- https://developers.openai.com/api/docs/models — offizieller Katalog: bestätigt gpt-5.6-terra als aktuelles Modell der Frontier-Familie.
- https://developers.openai.com/api/docs/models/all — Positionierung „balances intelligence and cost".
- https://developers.openai.com/api/docs/guides/latest-model — „strong performance at a lower price", Migrations-Baseline (eine Effort-Stufe tiefer), Trimming-/Verbosity-Leitlinie, Familienstärken, Safeguard-Pausen.
- https://developers.openai.com/api/docs/guides/prompt-guidance?model=gpt-5.6-sol — gemeinsame GPT-5.6-Prompt-Regeln: schlanke Prompts (10–15 % / 41–66 %), Autonomiegrenzen, `text.verbosity`, Programmatic Tool Calling, `reasoning.context`.
- https://developers.openai.com/api/docs/guides/reasoning — Effort-Stufen und ihre Semantik, `reasoning.mode` standard/pro, `reasoning.context`-Default `all_turns` für GPT-5.6.
- https://developers.openai.com/api/docs/deprecations — Ersatz-Mapping gpt-5-mini-2025-08-07 → gpt-5.6-terra, Shutdown 11.12.2026.
- https://developers.openai.com/api/docs/models/gpt-5.6-luna — günstigere Nano-Stufe ($0,2/$0,02/$1,2) zur Einordnung der Tier-Leiter.
