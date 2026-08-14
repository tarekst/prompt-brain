---
model: grok-4.3
vendor: xAI
family: Grok
aliases: [grok4.3, grok-4.3-latest, grok43, grok-4-3, grok4-3]
last_verified: 2026-08-14
status: current
---

# Grok 4.3

## Reasoning / Thinking
- Typ: **abschaltbar** — grok-4.3 wird laut Retirement-Tabelle auch mit `reasoning_effort: none` betrieben (bei grok-4.6/4.5 ist Reasoning laut Doku nicht abschaltbar). Offiziell belegte Leiter: `none | low | medium | high` (Retirement-Seite: die non-reasoning-Slugs landen auf `none`, die reasoning-Slugs auf `low`, mit ausdrücklichem Hinweis, `medium`/`high` explizit zu setzen, wenn die Aufgabe tiefer denken soll).
- **`reasoning_effort` immer explizit setzen.** Die Reasoning-Capability-Seite listet grok-4.3 gar nicht (nur grok-4.6, grok-4.5 und grok-4.20-multi-agent), der Default für grok-4.3 ist damit nicht dokumentiert (unbelegt) — nicht auf einen geerbten Wert verlassen.
- Klassenregeln für xAI-Reasoning-Modelle (Reasoning-Tokens werden mitabgerechnet und als `reasoning_tokens` in der Usage ausgewiesen; `presence_penalty`/`frequency_penalty`/`stop` führen zu einem Fehler) dürften greifen, sind für grok-4.3 aber nicht belegt (unbelegt) — die Reasoning-Seite führt das Modell nicht auf. Defensiv behandeln: diese Parameter weglassen.

## Prompting-Stil
- xAI beschreibt das Modell als „Fast, reliable model with strong tool calling and instruction following capabilities" — also **direktiv und schema-getrieben** prompten: klare Anweisungen, saubere Tool-/Function-Definitionen, kein defensives Nacherklären der Tools in Prosa.
- Weil der Effort bis auf `none` fallen kann, trägt der Prompt bei niedrigem Effort mehr Last: Ziel, Output-Form und Tool-Policy explizit ausformulieren, statt das Modell sich den Weg selbst planen zu lassen.
- Format über **Structured Outputs** erzwingen statt über Freitext-Konventionen (Structured Outputs sind für grok-4.3 ausdrücklich belegt) — nicht auf `stop`-Sequenzen bauen, die für xAI-Reasoning-Modelle generell ausgeschlossen sind (für grok-4.3 selbst unbelegt).
- Positionierung laut offiziellem Listing: für Code und Chat empfiehlt xAI grok-4.6, nicht 4.3. grok-4.3 ist der günstige Long-Context-Durchsatz-Arbeiter, nicht die Reasoning-Spitze.
- Eine eigene Developer-/Prompting-Seite für grok-4.3 existiert nicht; jede darüber hinausgehende Stilaussage ist unbelegt.

## Stärken & Schwächen (prompt-relevant)
- Stärken: **1M Tokens Kontext** (doppelt so viel wie grok-4.6 mit 500k); günstiger als grok-4.6 ($1.25/$2.50 vs. $2.00/$6.00 pro 1M — Input −37,5 %, Output −58 %); zusätzliche **EU-Region** (eu-west-1 neben us-east-1/us-west-2) für Data-Residency-Anforderungen; weitere 20 % Rabatt über die Batch API; xAIs eigenes Migrationsziel für die abgekündigten Grok-4-Fast- und Legacy-Text-Slugs (`grok-4-fast-*`, `grok-4-1-fast-*`, `grok-3`) inkl. `grok-4-0709` (Ausnahme: `grok-code-fast-1` → `grok-build-0.1`); dokumentierter Effort-Pfad bis hinunter zu `none`, den grok-4.6/4.5 nicht haben.
- Schwächen/Eigenheiten: deutlich niedrigere Durchsatzdecke als das Flaggschiff (37 Requests/s, 10M Tokens/min vs. 150 rps / 50M tpm); **Preisklippe bei 200k Prompt-Tokens** — ab da gilt der doppelte Satz für ALLE Tokens des Requests; nicht das für Code/Chat empfohlene Modell; kein publizierter Knowledge Cutoff, kein publiziertes Output-Limit, keine offiziellen Benchmark-Angaben.

## Output- & Format-Konventionen
- 1.000.000 Tokens Kontextfenster; Input Text + Bild, Output nur Text. Max. Output-Tokens: nicht publiziert (unbelegt). Knowledge Cutoff: nicht publiziert (unbelegt).
- Function Calling: ja; Structured Outputs: ja; Reasoning: ja.
- Preise pro 1M Tokens: Input $1.25 (<200k Prompt) / $2.50 (≥200k), Cached Input $0.20 / $0.40, Output $2.50 / $5.00; Batch API zusätzlich −20 %. Rate Limits: 37 Requests/s, 10M Tokens/min; Regionen us-east-1, eu-west-1, us-west-2.
- Dokumentierter Alias `grok-4.3-latest` neben der blanken id `grok-4.3`.

## Migrations-Hinweise
- **VON grok-4.3 weg** (zu grok-4.6): `none` fällt weg — Reasoning ist dort nicht abschaltbar, jeder Zero-Thinking-Schnellpfad muss auf `low` re-tuned und neu kalkuliert werden; Kontext schrumpft von 1M auf 500k; die EU-Region entfällt (nur us-east-1/us-west-2); `prompt_cache_key` bzw. `x-grok-conv-id` für Cache-Hit-Routing ergänzen; `xhigh` kommt als zusätzliche Stufe hinzu; Preis steigt auf $2.00/$6.00.
- **ZU grok-4.3 migrieren** (von grok-4): dies ist xAIs **eigenes vorgeschriebenes Ziel** — `grok-4-0709` wird am 15. Mai 2026, 12:00 PT abgeschaltet und automatisch auf `grok-4.3` mit `low` Effort geroutet; eine unangetastete grok-4-Integration läuft danach still auf flacherem Reasoning. Konkret: (1) `reasoning_effort` explizit setzen — grok-4 kannte den Parameter nicht und dachte immer tief (unbelegt — die grok-4-Modellseiten sind offline/404); hing die Qualität daran, `medium`/`high` setzen statt das geroutete `low` zu akzeptieren. (2) `none` ist neu verfügbar — latenzkritische Extraktions-/Klassifikations-Prompts auf einen Single-Pass-Call umstellen. (3) Kontext wächst von 256k (unbelegt — grok-4 ist nicht mehr gelistet) auf 1M, aber die 200k-Preisklippe verdoppelt Input **und** Output des ganzen Requests — Chunking-Strategie wiegt schwerer als reine Kapazität. (4) Kosten fallen deutlich, Durchsatz ist auf 37 rps / 10M tpm gedeckelt — Concurrency-Annahmen neu austarieren. (5) eu-west-1 wird verfügbar. (6) `presence_penalty`/`frequency_penalty`/`stop` weiterhin weglassen, Formatkontrolle über Structured Outputs.

## Quellen
- https://docs.x.ai/developers/models/grok-4.3 — Modellseite: id `grok-4.3` + Alias `grok-4.3-latest`, Blurb „Fast, reliable model with strong tool calling and instruction following capabilities", 1M Kontext, Text+Bild→Text, Function Calling/Structured Outputs/Reasoning ja, volle Preistabelle inkl. Cached Input und 20 % Batch-Rabatt, 37 rps / 10M tpm, Regionen us-east-1/eu-west-1/us-west-2; ohne Prompting-Guidance, ohne Cutoff, ohne Output-Limit.
- https://docs.x.ai/docs/models/grok-4.3 — Spiegelseite derselben Spezifikation; bestätigt 1M Kontext, Preisstaffeln an der 200k-Grenze, Rate Limits, Regionen und dass kein Output-Limit und kein Cutoff angegeben ist.
- https://docs.x.ai/developers/migration/may-15-retirement — Retirement-Tabelle: `grok-4-0709`, `grok-4-fast-reasoning`, `grok-4-1-fast-reasoning` → `grok-4.3` mit `low`; `grok-3` und die non-reasoning-Slugs → `grok-4.3` mit `none`; Abschaltung 15. Mai 2026 12:00 PT; Hinweis auf explizites `medium`/`high`; $1.25/$2.50 pro 1M.
- https://docs.x.ai/docs/models — offizielles Listing: grok-4.3 mit 1M Kontext neben grok-4.6 (500k, Flaggschiff, Cutoff 2026-02-01); für Code und Chat wird grok-4.6 empfohlen; für grok-4.3 kein Cutoff gelistet.
- https://docs.x.ai/developers/model-capabilities/text/reasoning — Klassenregeln für Reasoning-Modelle (`reasoning_tokens`-Abrechnung; `presencePenalty`/`frequencyPenalty`/`stop` → Fehler); enumeriert nur `grok-4.6` (`low`/`medium`/`high` Default/`xhigh`), `grok-4.5` und `grok-4.20-multi-agent`, **nicht** grok-4.3 — daher sind dessen Default-Effort, die Klassenregeln und die dortige Aussage „Reasoning cannot be disabled" nicht auf grok-4.3 übertragbar.
- https://docs.x.ai/developers/models — Alias-Konvention (`<modelname>`, `<modelname>-latest`, `<modelname>-<date>`) und aktuelles Roster mit grok-4.3, aber ohne grok-4/grok-4-0709.
- https://docs.x.ai/developers/models/grok-4.6 — Vergleichswerte des Flaggschiffs für die Migrationsrichtung: 500k Kontext, $2.00/$6.00 pro 1M (≥200k: $4.00/$12.00), 150 rps / 50M tpm, Regionen nur us-east-1 und us-west-2 (kein eu-west-1).
- https://docs.x.ai/developers/grok-4-6 — Cache-Hit-Routing auf grok-4.6 über `prompt_cache_key` (Responses API) bzw. Header `x-grok-conv-id` (Chat Completions); `reasoning_effort` low/medium/high (Default)/xhigh.
